from datetime import datetime
from typing import Literal, Optional

from pydantic import field_validator

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

    @field_validator("event_type_id", "title", "guest_name", "guest_email")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Field is required")
        return value.strip()

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class RequestDeletionCodeRequest(ApiModel):
    guest_email: str

    @field_validator("guest_email")
    @classmethod
    def validate_guest_email(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Field is required")
        return value.strip()


class DeletionCodeRequested(ApiModel):
    message: str


class DeleteBookingRequest(ApiModel):
    guest_email: str
    code: str

    @field_validator("guest_email", "code")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Field is required")
        return value.strip()
