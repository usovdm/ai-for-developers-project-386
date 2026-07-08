from functools import lru_cache
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./.data/app.db"
    static_dir: str = ""
    frontend_origin: str = "http://localhost:5173"
    frontend_origins: str = ""
    admin_login: str = "admin"
    admin_password: str = "admin"
    admin_token: str = "dev-admin-token"
    timezone: str = "Europe/Moscow"
    booking_window_days: int = 14

    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", extra="ignore")

    @property
    def tzinfo(self) -> ZoneInfo:
        return ZoneInfo(self.timezone)

    @property
    def cors_origins(self) -> list[str]:
        if self.frontend_origins:
            return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

        origins = [self.frontend_origin]
        if self.frontend_origin == "http://localhost:5173":
            origins.append("http://127.0.0.1:5173")
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
