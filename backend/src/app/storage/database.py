import os
from typing import Generator, Optional

from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.engine import Engine

from app.config import get_settings
from app.storage.models import AvailabilitySettingsModel

_engine: Optional[Engine] = None


def _connect_args(database_url: str):
    if database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


def _ensure_sqlite_directory(database_url: str) -> None:
    if not database_url.startswith("sqlite:///"):
        return

    path = database_url.replace("sqlite:///", "", 1)
    if path == ":memory:":
        return

    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        settings = get_settings()
        _ensure_sqlite_directory(settings.database_url)
        _engine = create_engine(
            settings.database_url,
            connect_args=_connect_args(settings.database_url),
        )
    return _engine


def reset_engine() -> None:
    global _engine
    if _engine is not None:
        _engine.dispose()
    _engine = None


def init_db() -> None:
    engine = get_engine()
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        settings = session.get(AvailabilitySettingsModel, 1)
        if settings is None:
            session.add(AvailabilitySettingsModel())
            session.commit()


def get_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session
