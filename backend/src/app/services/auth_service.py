from app.config import get_settings
from app.schemas.auth import AdminLoginRequest, AdminSession
from app.schemas.errors import ApiError


def login_admin(request: AdminLoginRequest) -> AdminSession:
    settings = get_settings()
    if request.login != settings.admin_login or request.password != settings.admin_password:
        raise ApiError(401, "unauthorized", "Invalid admin credentials")
    return AdminSession(token=settings.admin_token)


def verify_admin_authorization(authorization: str) -> None:
    expected = "Bearer %s" % get_settings().admin_token
    if authorization != expected:
        raise ApiError(401, "unauthorized", "Admin authorization is required")
