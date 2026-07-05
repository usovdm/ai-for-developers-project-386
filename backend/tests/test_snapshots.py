from datetime import datetime

from conftest import create_booking, create_event_type, future_start_at, set_availability


def test_existing_booking_keeps_event_type_snapshot_after_event_type_update(
    client,
    admin_headers,
    open_availability,
):
    event_type = create_event_type(client, admin_headers, title="Old title", duration_minutes=30)
    old_booking = create_booking(client, event_type["id"], future_start_at(hour=10), title="Old booking")

    response = client.patch(
        "/admin/event-types/%s" % event_type["id"],
        headers=admin_headers,
        json={"title": "New title", "durationMinutes": 45},
    )
    assert response.status_code == 200

    new_booking = create_booking(client, event_type["id"], future_start_at(hour=11), title="New booking")
    upcoming = client.get("/admin/bookings/upcoming", headers=admin_headers)
    assert upcoming.status_code == 200
    bookings_by_title = {booking["title"]: booking for booking in upcoming.json()}

    assert bookings_by_title["Old booking"]["eventTypeTitle"] == "Old title"
    assert bookings_by_title["Old booking"]["endAt"] == old_booking["endAt"]
    assert bookings_by_title["New booking"]["eventTypeTitle"] == "New title"

    new_start = datetime.fromisoformat(new_booking["startAt"])
    new_end = datetime.fromisoformat(new_booking["endAt"])
    assert int((new_end - new_start).total_seconds() / 60) == 45


def test_existing_booking_survives_availability_update_that_excludes_its_slot(
    client,
    admin_headers,
    open_availability,
):
    event_type = create_event_type(client, admin_headers)
    booking = create_booking(client, event_type["id"], future_start_at(hour=10), title="Preserved booking")

    set_availability(client, admin_headers, start_time="12:00", end_time="13:00")

    upcoming = client.get("/admin/bookings/upcoming", headers=admin_headers)
    assert upcoming.status_code == 200
    assert any(item["id"] == booking["id"] for item in upcoming.json())

    unavailable_response = client.post(
        "/bookings",
        json={
            "eventTypeId": event_type["id"],
            "startAt": future_start_at(hour=10, minute=30).isoformat(),
            "title": "Now unavailable booking",
            "guestName": "Guest",
            "guestEmail": "guest@example.com",
        },
    )
    assert unavailable_response.status_code == 422
    assert unavailable_response.json()["error"]["code"] == "slot_unavailable"
