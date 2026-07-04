from typing import List, Literal

from app.schemas.base import ApiModel

DayOfWeek = Literal[
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]


class AvailabilitySettings(ApiModel):
    work_days: List[DayOfWeek]
    start_time: str
    end_time: str


class UpdateAvailabilitySettingsRequest(AvailabilitySettings):
    pass
