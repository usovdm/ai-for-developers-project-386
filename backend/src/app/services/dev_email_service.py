import uuid
from typing import List

from sqlmodel import Session, select

from app.schemas.bookings import Booking
from app.schemas.dev_emails import DevEmail
from app.services.time_service import now_local
from app.storage.models import DevEmailModel


def _to_schema(model: DevEmailModel) -> DevEmail:
    return DevEmail(
        id=model.id,
        recipient_email=model.recipient_email,
        subject=model.subject,
        body=model.body,
        created_at=model.created_at,
    )


def create_dev_email(session: Session, recipient_email: str, subject: str, body: str) -> DevEmail:
    model = DevEmailModel(
        id=str(uuid.uuid4()),
        recipient_email=recipient_email,
        subject=subject,
        body=body,
        created_at=now_local(),
    )
    session.add(model)
    session.commit()
    session.refresh(model)
    return _to_schema(model)


def send_booking_confirmation(session: Session, booking: Booking) -> DevEmail:
    return create_dev_email(
        session,
        recipient_email=booking.guest_email,
        subject=f"Booking confirmed: {booking.title}",
        body=(
            f"{booking.title}\n"
            f"Event type: {booking.event_type_title}\n"
            f"Date and time: {booking.start_at.isoformat()} - {booking.end_at.isoformat()}"
        ),
    )


def send_deletion_code(session: Session, recipient_email: str, code: str) -> DevEmail:
    return create_dev_email(
        session,
        recipient_email=recipient_email,
        subject="Booking deletion code",
        body=f"Your booking deletion code is {code}",
    )


def list_dev_emails(session: Session) -> List[DevEmail]:
    statement = select(DevEmailModel).order_by(DevEmailModel.created_at.desc())
    return [_to_schema(model) for model in session.exec(statement).all()]
