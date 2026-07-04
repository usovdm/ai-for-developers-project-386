from typing import List

from fastapi import APIRouter, Body, Depends, Response, status
from sqlmodel import Session

from app.api.dependencies import require_admin
from app.schemas.auth import AdminLoginRequest, AdminSession
from app.schemas.availability import AvailabilitySettings, UpdateAvailabilitySettingsRequest
from app.schemas.bookings import Booking
from app.schemas.event_types import CreateEventTypeRequest, EventType, UpdateEventTypeRequest
from app.services.auth_service import login_admin
from app.services.availability_service import get_availability_settings, update_availability_settings
from app.services.booking_service import delete_booking_as_admin, list_upcoming_bookings
from app.services.event_type_service import (
    create_event_type,
    delete_event_type,
    list_admin_event_types,
    update_event_type,
)
from app.storage.database import get_session

router = APIRouter(tags=["Admin"])


@router.post("/admin/login", response_model=AdminSession)
def post_admin_login(request: AdminLoginRequest):
    return login_admin(request)


@router.get(
    "/admin/event-types",
    response_model=List[EventType],
    dependencies=[Depends(require_admin)],
)
def get_admin_event_types(session: Session = Depends(get_session)):
    return list_admin_event_types(session)


@router.post(
    "/admin/event-types",
    response_model=EventType,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def post_event_type(request: CreateEventTypeRequest, session: Session = Depends(get_session)):
    return create_event_type(session, request)


@router.patch(
    "/admin/event-types/{event_type_id}",
    response_model=EventType,
    dependencies=[Depends(require_admin)],
)
def patch_event_type(
    event_type_id: str,
    request: UpdateEventTypeRequest,
    session: Session = Depends(get_session),
):
    return update_event_type(session, event_type_id, request)


@router.delete(
    "/admin/event-types/{event_type_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def remove_event_type(event_type_id: str, session: Session = Depends(get_session)):
    delete_event_type(session, event_type_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/admin/availability",
    response_model=AvailabilitySettings,
    dependencies=[Depends(require_admin)],
)
def get_availability(session: Session = Depends(get_session)):
    return get_availability_settings(session)


@router.put(
    "/admin/availability",
    response_model=AvailabilitySettings,
    dependencies=[Depends(require_admin)],
)
def put_availability(
    request: UpdateAvailabilitySettingsRequest,
    session: Session = Depends(get_session),
):
    return update_availability_settings(session, request)


@router.get(
    "/admin/bookings/upcoming",
    response_model=List[Booking],
    dependencies=[Depends(require_admin)],
)
def get_upcoming_bookings(session: Session = Depends(get_session)):
    return list_upcoming_bookings(session)


@router.delete(
    "/admin/bookings/{booking_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def remove_booking_as_admin(booking_id: str, session: Session = Depends(get_session)):
    delete_booking_as_admin(session, booking_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
