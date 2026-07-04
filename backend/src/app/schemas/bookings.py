from datetime import datetime
from typing import Literal, Optional

from app.schemas.base import ApiModel

CalendarSlotStatus = Literal["free", "occupied", "unavailable"]


class PublicBookingSummary(ApiModel):
    id: str
    event_type_id: str
    event_type_title: str
    title: str
    start_at: datetime
    end_at: datetime


class CalendarSlot(ApiModel):
    start_at: datetime
    end_at: datetime
    status: CalendarSlotStatus
    event_type_id: Optional[str] = None
    booking: Optional[PublicBookingSummary] = None


class Booking(ApiModel):
    id: str
    event_type_id: str
    event_type_title: str
    title: str
    guest_name: str
    guest_email: str
    comment: Optional[str] = None
    start_at: datetime
    end_at: datetime
    created_at: datetime


class CreateBookingRequest(ApiModel):
    event_type_id: str
    start_at: datetime
    title: str
    guest_name: str
    guest_email: str
    comment: Optional[str] = None


class RequestDeletionCodeRequest(ApiModel):
    guest_email: str


class DeletionCodeRequested(ApiModel):
    message: str


class DeleteBookingRequest(ApiModel):
    guest_email: str
    code: str
