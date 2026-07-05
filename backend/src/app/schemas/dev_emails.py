from datetime import datetime

from app.schemas.base import ApiModel


class DevEmail(ApiModel):
    id: str
    recipient_email: str
    subject: str
    body: str
    created_at: datetime
