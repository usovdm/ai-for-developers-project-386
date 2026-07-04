from typing import List

from sqlmodel import Session

from app.schemas.availability import AvailabilitySettings, UpdateAvailabilitySettingsRequest
from app.schemas.errors import ApiError
from app.services.time_service import is_15_minute_step, parse_time_of_day
from app.storage.models import AvailabilitySettingsModel


def _to_schema(model: AvailabilitySettingsModel) -> AvailabilitySettings:
    return AvailabilitySettings(
        work_days=[day for day in model.work_days.split(",") if day],
        start_time=model.start_time,
        end_time=model.end_time,
    )


def get_availability_settings(session: Session) -> AvailabilitySettings:
    model = session.get(AvailabilitySettingsModel, 1)
    if model is None:
        model = AvailabilitySettingsModel()
        session.add(model)
        session.commit()
        session.refresh(model)
    return _to_schema(model)


def update_availability_settings(
    session: Session,
    request: UpdateAvailabilitySettingsRequest,
) -> AvailabilitySettings:
    if not request.work_days:
        raise ApiError(400, "validation_error", "At least one work day is required")
    if not is_15_minute_step(request.start_time) or not is_15_minute_step(request.end_time):
        raise ApiError(400, "validation_error", "Availability times must use a 15-minute step")
    if parse_time_of_day(request.end_time) <= parse_time_of_day(request.start_time):
        raise ApiError(400, "validation_error", "End time must be later than start time")

    model = session.get(AvailabilitySettingsModel, 1)
    if model is None:
        model = AvailabilitySettingsModel()
        session.add(model)

    model.work_days = ",".join(request.work_days)
    model.start_time = request.start_time
    model.end_time = request.end_time
    session.commit()
    session.refresh(model)
    return _to_schema(model)


def work_days_as_list(model: AvailabilitySettingsModel) -> List[str]:
    return [day for day in model.work_days.split(",") if day]
