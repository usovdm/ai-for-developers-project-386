import re
from datetime import date, datetime, time

from app.config import get_settings

DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def now_local() -> datetime:
    return datetime.now(get_settings().tzinfo).replace(tzinfo=None, microsecond=0)


def today_local() -> date:
    return now_local().date()


def normalize_datetime(value: datetime) -> datetime:
    settings = get_settings()
    if value.tzinfo is None:
        return value.replace(tzinfo=None, microsecond=0)
    return value.astimezone(settings.tzinfo).replace(tzinfo=None, microsecond=0)


def parse_time_of_day(value: str) -> time:
    if re.fullmatch(r"\d{2}:\d{2}", value) is None:
        raise ValueError("Time must use HH:mm format")
    return time.fromisoformat(value)


def combine_local(value_date: date, value_time: time) -> datetime:
    return datetime.combine(value_date, value_time).replace(microsecond=0)


def day_name(value: date) -> str:
    return DAY_NAMES[value.weekday()]


def is_15_minute_step(value: str) -> bool:
    try:
        parsed = parse_time_of_day(value)
    except ValueError:
        return False
    return parsed.minute % 15 == 0 and parsed.second == 0 and parsed.microsecond == 0
