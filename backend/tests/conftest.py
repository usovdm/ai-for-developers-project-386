from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.storage.database import reset_engine


@pytest.fixture()
def client(monkeypatch, tmp_path):
    database_path = tmp_path / "test.db"
    monkeypatch.setenv("APP_DATABASE_URL", "sqlite:///%s" % database_path)
    monkeypatch.setenv("APP_FRONTEND_ORIGIN", "http://localhost:5173")
    monkeypatch.setenv("APP_ADMIN_LOGIN", "admin")
    monkeypatch.setenv("APP_ADMIN_PASSWORD", "admin")
    monkeypatch.setenv("APP_ADMIN_TOKEN", "test-admin-token")
    get_settings.cache_clear()
    reset_engine()

    from app.main import create_app

    with TestClient(create_app()) as test_client:
        yield test_client

    reset_engine()
    get_settings.cache_clear()


@pytest.fixture()
def admin_headers(client):
    response = client.post("/admin/login", json={"login": "admin", "password": "admin"})
    assert response.status_code == 200
    return {"Authorization": "Bearer %s" % response.json()["token"]}


@pytest.fixture()
def open_availability(client, admin_headers):
    response = client.put(
        "/admin/availability",
        headers=admin_headers,
        json={
            "workDays": [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ],
            "startTime": "00:00",
            "endTime": "23:45",
        },
    )
    assert response.status_code == 200


def future_start_at():
    return (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
