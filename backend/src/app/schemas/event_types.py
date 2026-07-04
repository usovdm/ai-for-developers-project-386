from typing import Literal, Optional

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


class UpdateEventTypeRequest(ApiModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[EventDurationMinutes] = None
