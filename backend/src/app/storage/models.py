from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class EventTypeModel(SQLModel, table=True):
    __tablename__ = "event_types"

    id: str = Field(primary_key=True)
    title: str
    description: str
    duration_minutes: int
    color: str


class AvailabilitySettingsModel(SQLModel, table=True):
    __tablename__ = "availability_settings"

    id: int = Field(default=1, primary_key=True)
    work_days: str = Field(default="monday,tuesday,wednesday,thursday,friday")
    start_time: str = Field(default="09:00")
    end_time: str = Field(default="18:00")


class BookingModel(SQLModel, table=True):
    __tablename__ = "bookings"

    id: str = Field(primary_key=True)
    event_type_id: str = Field(index=True)
    event_type_title: str
    title: str
    guest_name: str
    guest_email: str = Field(index=True)
    comment: Optional[str] = None
    start_at: datetime = Field(index=True)
    end_at: datetime = Field(index=True)
    created_at: datetime


class EmailCodeModel(SQLModel, table=True):
    __tablename__ = "email_codes"

    id: str = Field(primary_key=True)
    booking_id: str = Field(index=True)
    guest_email: str = Field(index=True)
    code: str
    created_at: datetime
    expires_at: datetime
    consumed_at: Optional[datetime] = None
