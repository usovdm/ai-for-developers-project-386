from conftest import create_booking, create_event_type, future_start_at


def test_booking_rejects_overlapping_intervals_across_different_durations(
    client,
    admin_headers,
    open_availability,
):
    long_event_type = create_event_type(
        client,
        admin_headers,
        title="Long consultation",
        duration_minutes=45,
    )
    short_event_type = create_event_type(
        client,
        admin_headers,
        title="Short sync",
        duration_minutes=15,
    )
    medium_event_type = create_event_type(
        client,
        admin_headers,
        title="Medium sync",
        duration_minutes=30,
    )

    create_booking(client, long_event_type["id"], future_start_at(hour=10), title="Existing long booking")

    for event_type, start_at in [
        (short_event_type, future_start_at(hour=10, minute=30)),
        (medium_event_type, future_start_at(hour=10, minute=15)),
    ]:
        response = client.post(
            "/bookings",
            json={
                "eventTypeId": event_type["id"],
                "startAt": start_at.isoformat(),
                "title": "Overlapping booking",
                "guestName": "Guest",
                "guestEmail": "overlap@example.com",
            },
        )

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "slot_conflict"


def test_booking_allows_adjacent_intervals(client, admin_headers, open_availability):
    event_type = create_event_type(client, admin_headers, duration_minutes=45)

    first = create_booking(client, event_type["id"], future_start_at(hour=10), title="First booking")
    second = create_booking(client, event_type["id"], future_start_at(hour=10, minute=45), title="Adjacent booking")

    assert first["endAt"] == future_start_at(hour=10, minute=45).isoformat()
    assert second["startAt"] == first["endAt"]
