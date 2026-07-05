from typing import Literal, Optional

from pydantic import field_validator

from app.schemas.base import ApiModel

EventDurationMinutes = Literal[15, 30, 45]
EventTypeColor = Literal["blue", "green", "yellow", "orange", "purple", "red"]


class EventType(ApiModel):
    id: str
    title: str
    description: str
    duration_minutes: EventDurationMinutes
    color: EventTypeColor


class CreateEventTypeRequest(ApiModel):
    title: str
    description: str
    duration_minutes: EventDurationMinutes

    @field_validator("title", "description")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Field is required")
        return value.strip()


class UpdateEventTypeRequest(ApiModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[EventDurationMinutes] = None

    @field_validator("title", "description")
    @classmethod
    def validate_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Field is required")
        return value.strip() if value is not None else None
