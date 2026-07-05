from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, Query, Response, status
from sqlmodel import Session

from app.schemas.bookings import (
    Booking,
    CalendarSlot,
    CreateBookingRequest,
    DeleteBookingRequest,
    DeletionCodeRequested,
    RequestDeletionCodeRequest,
)
from app.schemas.dev_emails import DevEmail
from app.schemas.event_types import EventType
from app.services.booking_service import create_booking
from app.services.calendar_service import list_calendar_slots
from app.services.dev_email_service import list_dev_emails
from app.services.email_service import delete_booking_as_guest, request_deletion_code
from app.services.event_type_service import list_public_event_types
from app.storage.database import get_session

router = APIRouter(tags=["Guest"])


@router.get("/event-types", response_model=List[EventType])
def list_event_types(session: Session = Depends(get_session)):
    return list_public_event_types(session)


@router.get("/calendar/slots", response_model=List[CalendarSlot])
def get_calendar_slots(
    event_type_id: Optional[str] = Query(default=None, alias="eventTypeId"),
    week_start_date: Optional[date] = Query(default=None, alias="weekStartDate"),
    session: Session = Depends(get_session),
):
    return list_calendar_slots(session, event_type_id, week_start_date)


@router.post("/bookings", response_model=Booking, status_code=status.HTTP_201_CREATED)
def post_booking(request: CreateBookingRequest, session: Session = Depends(get_session)):
    return create_booking(session, request)


@router.post(
    "/bookings/{booking_id}/deletion-code",
    response_model=DeletionCodeRequested,
    status_code=status.HTTP_202_ACCEPTED,
)
def post_booking_deletion_code(
    booking_id: str,
    request: RequestDeletionCodeRequest,
    session: Session = Depends(get_session),
):
    return request_deletion_code(session, booking_id, request)


@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: str,
    request: DeleteBookingRequest = Body(...),
    session: Session = Depends(get_session),
):
    delete_booking_as_guest(session, booking_id, request)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/dev/emails", response_model=List[DevEmail])
def get_dev_emails(session: Session = Depends(get_session)):
    return list_dev_emails(session)
