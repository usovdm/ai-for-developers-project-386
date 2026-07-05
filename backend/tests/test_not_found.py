from conftest import create_event_type


def assert_not_found(response):
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_booking_unknown_event_type_returns_not_found(client, open_availability):
    response = client.post(
        "/bookings",
        json={
            "eventTypeId": "missing-event-type",
            "startAt": "2030-01-01T10:00:00",
            "title": "Missing event type booking",
            "guestName": "Guest",
            "guestEmail": "guest@example.com",
        },
    )

    assert_not_found(response)


def test_calendar_unknown_event_type_returns_not_found(client):
    assert_not_found(client.get("/calendar/slots", params={"eventTypeId": "missing-event-type"}))


def test_admin_event_type_unknown_id_returns_not_found(client, admin_headers):
    patch_response = client.patch(
        "/admin/event-types/missing-event-type",
        headers=admin_headers,
        json={"title": "Updated"},
    )
    delete_response = client.delete("/admin/event-types/missing-event-type", headers=admin_headers)

    assert_not_found(patch_response)
    assert_not_found(delete_response)


def test_guest_booking_deletion_unknown_id_returns_not_found(client):
    code_response = client.post(
        "/bookings/missing-booking/deletion-code",
        json={"guestEmail": "guest@example.com"},
    )
    delete_response = client.request(
        "DELETE",
        "/bookings/missing-booking",
        json={"guestEmail": "guest@example.com", "code": "000000"},
    )

    assert_not_found(code_response)
    assert_not_found(delete_response)


def test_admin_booking_unknown_id_returns_not_found(client, admin_headers):
    assert_not_found(client.delete("/admin/bookings/missing-booking", headers=admin_headers))


def test_event_type_delete_still_finds_existing_empty_type(client, admin_headers):
    event_type = create_event_type(client, admin_headers)

    response = client.delete("/admin/event-types/%s" % event_type["id"], headers=admin_headers)

    assert response.status_code == 204
