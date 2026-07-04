from typing import Optional

from fastapi import Header

from app.services.auth_service import verify_admin_authorization


def require_admin(authorization: Optional[str] = Header(default=None)) -> None:
    verify_admin_authorization(authorization or "")
