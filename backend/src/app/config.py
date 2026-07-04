from functools import lru_cache
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./.data/app.db"
    frontend_origin: str = "http://localhost:5173"
    admin_login: str = "admin"
    admin_password: str = "admin"
    admin_token: str = "dev-admin-token"
    timezone: str = "Europe/Moscow"
    booking_window_days: int = 14

    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", extra="ignore")

    @property
    def tzinfo(self) -> ZoneInfo:
        return ZoneInfo(self.timezone)


@lru_cache
def get_settings() -> Settings:
    return Settings()
