from datetime import date, timedelta
from typing import List, Optional

from sqlmodel import Session, select

from app.config import get_settings
from app.schemas.bookings import CalendarSlot, PublicBookingSummary
from app.schemas.errors import ApiError
from app.services.availability_service import work_days_as_list
from app.services.time_service import combine_local, day_name, now_local, parse_time_of_day, today_local
from app.storage.models import AvailabilitySettingsModel, BookingModel
from app.storage.repositories import get_event_type, list_bookings_between


def _booking_summary(model: BookingModel) -> PublicBookingSummary:
    return PublicBookingSummary(
        id=model.id,
        event_type_id=model.event_type_id,
        event_type_title=model.event_type_title,
        title=model.title,
        start_at=model.start_at,
        end_at=model.end_at,
    )


def _get_availability_model(session: Session) -> AvailabilitySettingsModel:
    model = session.get(AvailabilitySettingsModel, 1)
    if model is None:
        model = AvailabilitySettingsModel()
        session.add(model)
        session.commit()
        session.refresh(model)
    return model


def list_calendar_slots(
    session: Session,
    event_type_id: Optional[str],
    week_start_date: Optional[date],
) -> List[CalendarSlot]:
    event_type = None
    step_minutes = 30

    if event_type_id:
        event_type = get_event_type(session, event_type_id)
        if event_type is None:
            raise ApiError(404, "not_found", "Event type not found")
        step_minutes = event_type.duration_minutes

    today = today_local()
    window_end = today + timedelta(days=get_settings().booking_window_days - 1)
    requested_start = week_start_date or today
    requested_end = requested_start + timedelta(days=6)

    if requested_end < today or requested_start > window_end:
        raise ApiError(400, "validation_error", "Requested week is outside the booking window")

    availability = _get_availability_model(session)
    work_days = set(work_days_as_list(availability))
    start_time = parse_time_of_day(availability.start_time)
    end_time = parse_time_of_day(availability.end_time)
    now = now_local()
    slots = []

    for offset in range(7):
        current_date = requested_start + timedelta(days=offset)
        if current_date < today or current_date > window_end:
            continue
        if day_name(current_date) not in work_days:
            continue

        cursor = combine_local(current_date, start_time)
        day_end = combine_local(current_date, end_time)

        while cursor < day_end:
            slot_end = cursor + timedelta(minutes=step_minutes)
            if slot_end > day_end:
                break

            booking = list_bookings_between(session, cursor, slot_end)
            occupied_booking = booking[0] if booking else None

            if occupied_booking is not None:
                slots.append(
                    CalendarSlot(
                        start_at=cursor,
                        end_at=slot_end,
                        status="occupied",
                        event_type_id=occupied_booking.event_type_id,
                        booking=_booking_summary(occupied_booking),
                    )
                )
            else:
                slots.append(
                    CalendarSlot(
                        start_at=cursor,
                        end_at=slot_end,
                        status="free" if event_type is not None and cursor >= now else "unavailable",
                        event_type_id=event_type.id if event_type is not None else None,
                    )
                )

            cursor = slot_end

    return slots


def has_interval_conflict(session: Session, start_at, end_at) -> bool:
    statement = select(BookingModel).where(BookingModel.start_at < end_at).where(BookingModel.end_at > start_at)
    return session.exec(statement).first() is not None
