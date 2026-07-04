from conftest import future_start_at


def create_event_type(client, admin_headers, duration_minutes=30):
    response = client.post(
        "/admin/event-types",
        headers=admin_headers,
        json={
            "title": "Intro call",
            "description": "Short introduction meeting",
            "durationMinutes": duration_minutes,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_admin_login_and_availability(client, admin_headers):
    unauthorized = client.get("/admin/event-types")
    assert unauthorized.status_code == 401
    assert unauthorized.json()["error"]["code"] == "unauthorized"

    failed_login = client.post("/admin/login", json={"login": "admin", "password": "wrong"})
    assert failed_login.status_code == 401

    availability = client.get("/admin/availability", headers=admin_headers)
    assert availability.status_code == 200
    assert availability.json() == {
        "workDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "startTime": "09:00",
        "endTime": "18:00",
    }

    updated = client.put(
        "/admin/availability",
        headers=admin_headers,
        json={"workDays": ["monday"], "startTime": "10:00", "endTime": "17:00"},
    )
    assert updated.status_code == 200
    assert updated.json()["startTime"] == "10:00"


def test_cors_allows_frontend_origin(client):
    response = client.options(
        "/event-types",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_event_type_crud_and_public_list(client, admin_headers):
    event_type = create_event_type(client, admin_headers, duration_minutes=45)
    assert event_type["durationMinutes"] == 45

    public_list = client.get("/event-types")
    assert public_list.status_code == 200
    assert public_list.json()[0]["id"] == event_type["id"]

    patched = client.patch(
        "/admin/event-types/%s" % event_type["id"],
        headers=admin_headers,
        json={"title": "Updated call"},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Updated call"

    deleted = client.delete("/admin/event-types/%s" % event_type["id"], headers=admin_headers)
    assert deleted.status_code == 204


def test_calendar_slots_use_contract_query_names(client, admin_headers, open_availability):
    event_type = create_event_type(client, admin_headers)
    response = client.get("/calendar/slots", params={"eventTypeId": event_type["id"]})

    assert response.status_code == 200
    slots = response.json()
    assert slots
    assert slots[0]["status"] in {"free", "unavailable", "occupied"}
    assert "startAt" in slots[0]


def test_booking_conflict_and_deletion_flows(client, admin_headers, open_availability):
    event_type = create_event_type(client, admin_headers)
    start_at = future_start_at().isoformat()

    booking_response = client.post(
        "/bookings",
        json={
            "eventTypeId": event_type["id"],
            "startAt": start_at,
            "title": "Project discussion",
            "guestName": "Guest",
            "guestEmail": "guest@example.com",
        },
    )
    assert booking_response.status_code == 201
    booking = booking_response.json()

    conflict = client.post(
        "/bookings",
        json={
            "eventTypeId": event_type["id"],
            "startAt": start_at,
            "title": "Overlapping meeting",
            "guestName": "Other Guest",
            "guestEmail": "other@example.com",
        },
    )
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "slot_conflict"

    blocked_delete = client.delete("/admin/event-types/%s" % event_type["id"], headers=admin_headers)
    assert blocked_delete.status_code == 409
    assert blocked_delete.json()["error"]["code"] == "event_type_has_future_bookings"

    code_request = client.post(
        "/bookings/%s/deletion-code" % booking["id"],
        json={"guestEmail": "guest@example.com"},
    )
    assert code_request.status_code == 202

    invalid_delete = client.request(
        "DELETE",
        "/bookings/%s" % booking["id"],
        json={"guestEmail": "guest@example.com", "code": "111111"},
    )
    assert invalid_delete.status_code == 401

    guest_delete = client.request(
        "DELETE",
        "/bookings/%s" % booking["id"],
        json={"guestEmail": "guest@example.com", "code": "000000"},
    )
    assert guest_delete.status_code == 204


def test_admin_can_delete_booking_without_email_code(client, admin_headers, open_availability):
    event_type = create_event_type(client, admin_headers)
    booking_response = client.post(
        "/bookings",
        json={
            "eventTypeId": event_type["id"],
            "startAt": future_start_at().isoformat(),
            "title": "Admin managed booking",
            "guestName": "Guest",
            "guestEmail": "guest@example.com",
        },
    )
    assert booking_response.status_code == 201

    upcoming = client.get("/admin/bookings/upcoming", headers=admin_headers)
    assert upcoming.status_code == 200
    assert len(upcoming.json()) == 1

    deleted = client.delete(
        "/admin/bookings/%s" % booking_response.json()["id"],
        headers=admin_headers,
    )
    assert deleted.status_code == 204
