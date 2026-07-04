import uuid
from datetime import timedelta

from sqlmodel import Session, select

from app.schemas.bookings import DeleteBookingRequest, DeletionCodeRequested, RequestDeletionCodeRequest
from app.schemas.errors import ApiError
from app.services.time_service import now_local
from app.storage.models import BookingModel, EmailCodeModel

DEV_DELETION_CODE = "000000"


def request_deletion_code(
    session: Session,
    booking_id: str,
    request: RequestDeletionCodeRequest,
) -> DeletionCodeRequested:
    booking = session.get(BookingModel, booking_id)
    if booking is None:
        raise ApiError(404, "not_found", "Booking not found")

    if booking.guest_email == request.guest_email:
        now = now_local()
        session.add(
            EmailCodeModel(
                id=str(uuid.uuid4()),
                booking_id=booking_id,
                guest_email=request.guest_email,
                code=DEV_DELETION_CODE,
                created_at=now,
                expires_at=now + timedelta(minutes=15),
            )
        )
        session.commit()

    return DeletionCodeRequested(message="If booking exists, a deletion code was sent")


def delete_booking_as_guest(session: Session, booking_id: str, request: DeleteBookingRequest) -> None:
    booking = session.get(BookingModel, booking_id)
    if booking is None:
        raise ApiError(404, "not_found", "Booking not found")

    now = now_local()
    code = session.exec(
        select(EmailCodeModel)
        .where(EmailCodeModel.booking_id == booking_id)
        .where(EmailCodeModel.guest_email == request.guest_email)
        .where(EmailCodeModel.code == request.code)
        .where(EmailCodeModel.consumed_at.is_(None))
        .where(EmailCodeModel.expires_at >= now)
        .order_by(EmailCodeModel.created_at.desc())
    ).first()

    if booking.guest_email != request.guest_email or code is None:
        raise ApiError(401, "unauthorized", "Invalid deletion code")

    code.consumed_at = now
    session.delete(booking)
    session.commit()
