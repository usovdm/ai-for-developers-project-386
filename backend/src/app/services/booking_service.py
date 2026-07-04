import uuid
from datetime import timedelta
from typing import List

from sqlmodel import Session

from app.config import get_settings
from app.schemas.bookings import Booking, CreateBookingRequest
from app.schemas.errors import ApiError
from app.services.availability_service import work_days_as_list
from app.services.calendar_service import has_interval_conflict
from app.services.time_service import (
    combine_local,
    day_name,
    normalize_datetime,
    now_local,
    parse_time_of_day,
    today_local,
)
from app.storage.models import AvailabilitySettingsModel, BookingModel
from app.storage.repositories import get_event_type, list_future_bookings


def _to_schema(model: BookingModel) -> Booking:
    return Booking(
        id=model.id,
        event_type_id=model.event_type_id,
        event_type_title=model.event_type_title,
        title=model.title,
        guest_name=model.guest_name,
        guest_email=model.guest_email,
        comment=model.comment,
        start_at=model.start_at,
        end_at=model.end_at,
        created_at=model.created_at,
    )


def _get_availability(session: Session) -> AvailabilitySettingsModel:
    model = session.get(AvailabilitySettingsModel, 1)
    if model is None:
        model = AvailabilitySettingsModel()
        session.add(model)
        session.commit()
        session.refresh(model)
    return model


def _validate_slot(session: Session, start_at, end_at) -> None:
    settings = get_settings()
    today = today_local()
    window_end = today + timedelta(days=settings.booking_window_days - 1)
    availability = _get_availability(session)

    if start_at < now_local():
        raise ApiError(422, "slot_unavailable", "Slot is in the past")
    if start_at.date() < today or start_at.date() > window_end:
        raise ApiError(422, "slot_unavailable", "Slot is outside the 14-day booking window")
    if day_name(start_at.date()) not in set(work_days_as_list(availability)):
        raise ApiError(422, "slot_unavailable", "Slot is outside working days")
    if start_at.minute % 15 != 0 or start_at.second != 0 or start_at.microsecond != 0:
        raise ApiError(422, "slot_unavailable", "Slot must start on a 15-minute step")

    work_start = combine_local(start_at.date(), parse_time_of_day(availability.start_time))
    work_end = combine_local(start_at.date(), parse_time_of_day(availability.end_time))
    if start_at < work_start or end_at > work_end:
        raise ApiError(422, "slot_unavailable", "Slot is outside working hours")


def create_booking(session: Session, request: CreateBookingRequest) -> Booking:
    event_type = get_event_type(session, request.event_type_id)
    if event_type is None:
        raise ApiError(404, "not_found", "Event type not found")

    start_at = normalize_datetime(request.start_at)
    end_at = start_at + timedelta(minutes=event_type.duration_minutes)
    _validate_slot(session, start_at, end_at)

    if has_interval_conflict(session, start_at, end_at):
        raise ApiError(409, "slot_conflict", "Slot intersects with an existing booking")

    model = BookingModel(
        id=str(uuid.uuid4()),
        event_type_id=event_type.id,
        event_type_title=event_type.title,
        title=request.title,
        guest_name=request.guest_name,
        guest_email=request.guest_email,
        comment=request.comment,
        start_at=start_at,
        end_at=end_at,
        created_at=now_local(),
    )
    session.add(model)
    session.commit()
    session.refresh(model)
    return _to_schema(model)


def list_upcoming_bookings(session: Session) -> List[Booking]:
    return [_to_schema(model) for model in list_future_bookings(session, now_local())]


def delete_booking_as_admin(session: Session, booking_id: str) -> None:
    model = session.get(BookingModel, booking_id)
    if model is None:
        raise ApiError(404, "not_found", "Booking not found")

    session.delete(model)
    session.commit()
