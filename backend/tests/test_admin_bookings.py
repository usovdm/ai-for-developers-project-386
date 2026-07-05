from conftest import create_booking, create_event_type, future_start_at


def test_upcoming_bookings_are_sorted_by_start_at(client, admin_headers, open_availability):
    event_type = create_event_type(client, admin_headers)

    create_booking(client, event_type["id"], future_start_at(days=3, hour=14), title="Third booking")
    create_booking(client, event_type["id"], future_start_at(days=1, hour=15), title="Second booking")
    create_booking(client, event_type["id"], future_start_at(days=1, hour=9), title="First booking")

    response = client.get("/admin/bookings/upcoming", headers=admin_headers)

    assert response.status_code == 200
    start_times = [booking["startAt"] for booking in response.json()]
    assert start_times == sorted(start_times)
