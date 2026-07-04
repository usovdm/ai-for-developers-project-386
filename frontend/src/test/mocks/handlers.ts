import { addMinutes, parseISO } from "date-fns";
import { HttpResponse, http } from "msw";
import type {
  AvailabilitySettings,
  CreateBookingRequest,
  CreateEventTypeRequest,
  DeleteBookingRequest,
  RequestDeletionCodeRequest,
  UpdateEventTypeRequest,
} from "@/shared/api";
import {
  availabilitySettings,
  bookings,
  buildCalendarSlots,
  eventTypes,
  findEventTypeTitle,
  setAvailabilitySettings,
} from "./fixtures/data";

const colors = ["blue", "green", "yellow", "orange", "purple", "red"] as const;

function requireAdmin(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization !== "Bearer demo-admin-token") {
    return HttpResponse.json(
      { error: { code: "unauthorized", message: "Admin token is missing or invalid" } },
      { status: 401 },
    );
  }

  return undefined;
}

export const handlers = [
  http.post("*/admin/login", async ({ request }) => {
    const body = (await request.json()) as { login?: string; password?: string };

    if (body.login === "admin" && body.password === "admin") {
      return HttpResponse.json({ token: "demo-admin-token" });
    }

    return HttpResponse.json({ error: { code: "unauthorized", message: "Invalid credentials" } }, { status: 401 });
  }),

  http.get("*/admin/event-types", ({ request }) => {
    const authError = requireAdmin(request);
    return authError ?? HttpResponse.json(eventTypes);
  }),

  http.post("*/admin/event-types", async ({ request }) => {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = (await request.json()) as CreateEventTypeRequest;
    const eventType = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description,
      durationMinutes: body.durationMinutes,
      color: colors[eventTypes.length % colors.length],
    };

    eventTypes.push(eventType);

    return HttpResponse.json(eventType, { status: 201 });
  }),

  http.patch("*/admin/event-types/:eventTypeId", async ({ params, request }) => {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const eventType = eventTypes.find((item) => item.id === params.eventTypeId);

    if (!eventType) {
      return HttpResponse.json({ error: { code: "not_found", message: "Event type not found" } }, { status: 404 });
    }

    const body = (await request.json()) as UpdateEventTypeRequest;
    Object.assign(eventType, body);

    return HttpResponse.json(eventType);
  }),

  http.delete("*/admin/event-types/:eventTypeId", ({ params, request }) => {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const hasFutureBookings = bookings.some((booking) => booking.eventTypeId === params.eventTypeId);

    if (hasFutureBookings) {
      return HttpResponse.json(
        { error: { code: "event_type_has_future_bookings", message: "Event type has future bookings" } },
        { status: 409 },
      );
    }

    const index = eventTypes.findIndex((item) => item.id === params.eventTypeId);

    if (index === -1) {
      return HttpResponse.json({ error: { code: "not_found", message: "Event type not found" } }, { status: 404 });
    }

    eventTypes.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/event-types", () => HttpResponse.json(eventTypes)),

  http.get("*/calendar/slots", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(buildCalendarSlots(url.searchParams.get("eventTypeId") ?? undefined));
  }),

  http.post("*/bookings", async ({ request }) => {
    const body = (await request.json()) as CreateBookingRequest;
    const eventType = eventTypes.find((item) => item.id === body.eventTypeId);

    if (!eventType) {
      return HttpResponse.json({ error: { code: "not_found", message: "Event type not found" } }, { status: 404 });
    }

    const startAt = parseISO(body.startAt);
    const endAt = addMinutes(startAt, eventType.durationMinutes);
    const hasConflict = bookings.some((booking) => body.startAt >= booking.startAt && body.startAt < booking.endAt);

    if (hasConflict) {
      return HttpResponse.json({ error: { code: "slot_conflict", message: "Slot is already occupied" } }, { status: 409 });
    }

    const booking = {
      id: crypto.randomUUID(),
      eventTypeId: body.eventTypeId,
      eventTypeTitle: findEventTypeTitle(body.eventTypeId),
      title: body.title,
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      comment: body.comment,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    bookings.push(booking);

    return HttpResponse.json(booking, { status: 201 });
  }),

  http.post("*/bookings/:bookingId/deletion-code", async ({ params, request }) => {
    const body = (await request.json()) as RequestDeletionCodeRequest;
    const booking = bookings.find((item) => item.id === params.bookingId && item.guestEmail === body.guestEmail);

    return HttpResponse.json(
      { message: booking ? "Deletion code is 000000 in MSW mode" : "If booking exists, a deletion code was sent" },
      { status: 202 },
    );
  }),

  http.delete("*/bookings/:bookingId", async ({ params, request }) => {
    const body = (await request.json()) as DeleteBookingRequest;
    const index = bookings.findIndex((item) => item.id === params.bookingId && item.guestEmail === body.guestEmail);

    if (index === -1 || body.code !== "000000") {
      return HttpResponse.json({ error: { code: "unauthorized", message: "Invalid deletion code" } }, { status: 401 });
    }

    bookings.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/admin/availability", ({ request }) => {
    const authError = requireAdmin(request);
    return authError ?? HttpResponse.json(availabilitySettings);
  }),

  http.put("*/admin/availability", async ({ request }) => {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const body = (await request.json()) as AvailabilitySettings;
    setAvailabilitySettings(body);

    return HttpResponse.json(body);
  }),

  http.get("*/admin/bookings/upcoming", ({ request }) => {
    const authError = requireAdmin(request);
    return authError ?? HttpResponse.json(bookings);
  }),

  http.delete("*/admin/bookings/:bookingId", ({ params, request }) => {
    const authError = requireAdmin(request);
    if (authError) return authError;

    const index = bookings.findIndex((item) => item.id === params.bookingId);

    if (index === -1) {
      return HttpResponse.json({ error: { code: "not_found", message: "Booking not found" } }, { status: 404 });
    }

    bookings.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),
];
