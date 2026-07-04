from typing import Literal, Optional

from app.schemas.base import ApiModel

ApiErrorCode = Literal[
    "validation_error",
    "unauthorized",
    "not_found",
    "slot_conflict",
    "event_type_has_future_bookings",
    "slot_unavailable",
]


class ApiErrorBody(ApiModel):
    code: ApiErrorCode
    message: str
    details: Optional[str] = None


class ApiErrorResponse(ApiModel):
    error: ApiErrorBody


class ApiError(Exception):
    def __init__(self, status_code: int, code: ApiErrorCode, message: str, details: Optional[str] = None):
        self.status_code = status_code
        self.body = ApiErrorBody(code=code, message=message, details=details)
        super().__init__(message)
