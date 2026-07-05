from conftest import create_event_type


def assert_validation_error(response):
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation_error"


def test_event_type_required_text_fields_reject_empty_strings(client, admin_headers):
    for payload in [
        {"title": "", "description": "Description", "durationMinutes": 30},
        {"title": "Title", "description": "   ", "durationMinutes": 30},
    ]:
        assert_validation_error(client.post("/admin/event-types", headers=admin_headers, json=payload))

    event_type = create_event_type(client, admin_headers)
    assert_validation_error(
        client.patch(
            "/admin/event-types/%s" % event_type["id"],
            headers=admin_headers,
            json={"title": ""},
        )
    )


def test_booking_required_text_fields_reject_empty_strings(client, admin_headers, open_availability):
    event_type = create_event_type(client, admin_headers)
    base_payload = {
        "eventTypeId": event_type["id"],
        "startAt": "2030-01-01T10:00:00",
        "title": "Booking",
        "guestName": "Guest",
        "guestEmail": "guest@example.com",
    }

    for field in ["title", "guestName", "guestEmail"]:
        payload = {**base_payload, field: "   "}
        assert_validation_error(client.post("/bookings", json=payload))


def test_availability_time_rejects_invalid_format_and_step(client, admin_headers):
    for start_time, end_time in [("09:10", "18:00"), ("09:00:00", "18:00"), ("bad", "18:00")]:
        response = client.put(
            "/admin/availability",
            headers=admin_headers,
            json={"workDays": ["monday"], "startTime": start_time, "endTime": end_time},
        )

        assert_validation_error(response)
