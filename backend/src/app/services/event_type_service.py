import secrets
import uuid
from typing import List

from sqlmodel import Session, select

from app.schemas.errors import ApiError
from app.schemas.event_types import CreateEventTypeRequest, EventType, UpdateEventTypeRequest
from app.services.time_service import now_local
from app.storage.models import BookingModel, EventTypeModel
from app.storage.repositories import get_event_type, list_event_types

COLORS = ["blue", "green", "yellow", "orange", "purple", "red"]


def _to_schema(model: EventTypeModel) -> EventType:
    return EventType(
        id=model.id,
        title=model.title,
        description=model.description,
        duration_minutes=model.duration_minutes,
        color=model.color,
    )


def list_public_event_types(session: Session) -> List[EventType]:
    return [_to_schema(model) for model in list_event_types(session)]


def list_admin_event_types(session: Session) -> List[EventType]:
    return list_public_event_types(session)


def create_event_type(session: Session, request: CreateEventTypeRequest) -> EventType:
    model = EventTypeModel(
        id=str(uuid.uuid4()),
        title=request.title,
        description=request.description,
        duration_minutes=request.duration_minutes,
        color=secrets.choice(COLORS),
    )
    session.add(model)
    session.commit()
    session.refresh(model)
    return _to_schema(model)


def update_event_type(session: Session, event_type_id: str, request: UpdateEventTypeRequest) -> EventType:
    model = get_event_type(session, event_type_id)
    if model is None:
        raise ApiError(404, "not_found", "Event type not found")

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(model, key, value)

    session.commit()
    session.refresh(model)
    return _to_schema(model)


def delete_event_type(session: Session, event_type_id: str) -> None:
    model = get_event_type(session, event_type_id)
    if model is None:
        raise ApiError(404, "not_found", "Event type not found")

    future_booking = session.exec(
        select(BookingModel)
        .where(BookingModel.event_type_id == event_type_id)
        .where(BookingModel.start_at >= now_local())
    ).first()
    if future_booking is not None:
        raise ApiError(
            409,
            "event_type_has_future_bookings",
            "Event type has future bookings",
        )

    session.delete(model)
    session.commit()
