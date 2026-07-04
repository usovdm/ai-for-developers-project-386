from datetime import datetime
from typing import Optional

from app.schemas.base import ApiModel


class AdminLoginRequest(ApiModel):
    login: str
    password: str


class AdminSession(ApiModel):
    token: str
    expires_at: Optional[datetime] = None
