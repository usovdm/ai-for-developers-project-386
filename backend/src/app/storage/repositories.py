from datetime import datetime
from typing import List, Optional

from sqlmodel import Session, select

from app.storage.models import BookingModel, EventTypeModel


def list_event_types(session: Session) -> List[EventTypeModel]:
    return list(session.exec(select(EventTypeModel).order_by(EventTypeModel.title)).all())


def get_event_type(session: Session, event_type_id: str) -> Optional[EventTypeModel]:
    return session.get(EventTypeModel, event_type_id)


def list_future_bookings(session: Session, now: datetime) -> List[BookingModel]:
    statement = select(BookingModel).where(BookingModel.start_at >= now).order_by(BookingModel.start_at)
    return list(session.exec(statement).all())


def list_bookings_between(session: Session, start_at: datetime, end_at: datetime) -> List[BookingModel]:
    statement = (
        select(BookingModel)
        .where(BookingModel.start_at < end_at)
        .where(BookingModel.end_at > start_at)
        .order_by(BookingModel.start_at)
    )
    return list(session.exec(statement).all())
