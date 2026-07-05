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


def future_start_at(hour=10, minute=0, days=1):
    return (datetime.now() + timedelta(days=days)).replace(
        hour=hour,
        minute=minute,
        second=0,
        microsecond=0,
    )


def create_event_type(client, admin_headers, title="Intro call", duration_minutes=30):
    response = client.post(
        "/admin/event-types",
        headers=admin_headers,
        json={
            "title": title,
            "description": "Short introduction meeting",
            "durationMinutes": duration_minutes,
        },
    )
    assert response.status_code == 201
    return response.json()


def create_booking(
    client,
    event_type_id,
    start_at,
    title="Project discussion",
    guest_email="guest@example.com",
):
    response = client.post(
        "/bookings",
        json={
            "eventTypeId": event_type_id,
            "startAt": start_at.isoformat(),
            "title": title,
            "guestName": "Guest",
            "guestEmail": guest_email,
        },
    )
    assert response.status_code == 201
    return response.json()


def set_availability(client, admin_headers, work_days=None, start_time="00:00", end_time="23:45"):
    response = client.put(
        "/admin/availability",
        headers=admin_headers,
        json={
            "workDays": work_days
            or [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ],
            "startTime": start_time,
            "endTime": end_time,
        },
    )
    assert response.status_code == 200
    return response.json()
