import "@typespec/http";

using TypeSpec.Http;

@service(#{
  title: "Meeting Booking API",
})
@doc("API contract for the MVP meeting booking application. All date-time values are interpreted in the Europe/Moscow time zone unless an explicit offset is present.")
namespace MeetingBookingApi;

@doc("ISO 8601 date in YYYY-MM-DD format.")
scalar Date extends string;

@doc("Local time in HH:mm format. Values must use a 15-minute step.")
scalar TimeOfDay extends string;

@doc("ISO 8601 date-time. The backend stores and validates bookings in the Europe/Moscow time zone.")
scalar DateTime extends string;

alias EventDurationMinutes = 15 | 30 | 45;

alias DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

alias EventTypeColor = "blue" | "green" | "yellow" | "orange" | "purple" | "red";

alias CalendarSlotStatus = "free" | "occupied" | "unavailable";

@doc("Bearer token returned by the admin login endpoint.")
model AdminAuthHeader {
  @header
  @doc("Admin authorization header in the format: Bearer <token>.")
  authorization: string;
}

@doc("Standard validation error response body.")
model ValidationErrorBody {
  code: "validation_error";
  message: string;
  details?: string;
}

@doc("Authentication or authorization error response body.")
model UnauthorizedErrorBody {
  code: "unauthorized";
  message: string;
}

@doc("Resource-not-found error response body.")
model NotFoundErrorBody {
  code: "not_found";
  message: string;
}

@doc("Returned when the requested booking interval intersects with an existing booking of any event type.")
model SlotConflictErrorBody {
  code: "slot_conflict";
  message: string;
}

@doc("Returned when an event type cannot be deleted because it has future bookings.")
model EventTypeHasFutureBookingsErrorBody {
  code: "event_type_has_future_bookings";
  message: string;
}

@doc("Returned when a slot is outside working hours, outside the 14-day booking window, in the past, or otherwise unavailable.")
model SlotUnavailableErrorBody {
  code: "slot_unavailable";
  message: string;
}

model ValidationErrorResponse {
  @statusCode statusCode: 400;
  @body error: ValidationErrorBody;
}

model UnauthorizedErrorResponse {
  @statusCode statusCode: 401;
  @body error: UnauthorizedErrorBody;
}

model NotFoundErrorResponse {
  @statusCode statusCode: 404;
  @body error: NotFoundErrorBody;
}

model SlotConflictErrorResponse {
  @statusCode statusCode: 409;
  @body error: SlotConflictErrorBody;
}

model EventTypeHasFutureBookingsErrorResponse {
  @statusCode statusCode: 409;
  @body error: EventTypeHasFutureBookingsErrorBody;
}

model SlotUnavailableErrorResponse {
  @statusCode statusCode: 422;
  @body error: SlotUnavailableErrorBody;
}

model NoContentResponse {
  @statusCode statusCode: 204;
}

@doc("Event type configured by the admin. Existing bookings keep the event settings that were actual when the booking was created.")
model EventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: EventDurationMinutes;
  color: EventTypeColor;
}

model CreateEventTypeRequest {
  title: string;
  description: string;
  durationMinutes: EventDurationMinutes;
}

model UpdateEventTypeRequest {
  title?: string;
  description?: string;
  durationMinutes?: EventDurationMinutes;
}

model CreatedEventTypeResponse {
  @statusCode statusCode: 201;
  @body eventType: EventType;
}

@doc("Global availability settings shared by all event types. Defaults are Monday-Friday, 09:00-18:00.")
model AvailabilitySettings {
  workDays: DayOfWeek[];
  startTime: TimeOfDay;
  endTime: TimeOfDay;
}

model UpdateAvailabilitySettingsRequest {
  workDays: DayOfWeek[];
  startTime: TimeOfDay;
  endTime: TimeOfDay;
}

@doc("Public booking data shown inside an occupied calendar slot. Guest name, email, and comment are intentionally hidden.")
model PublicBookingSummary {
  id: string;
  eventTypeId: string;
  eventTypeTitle: string;
  title: string;
  startAt: DateTime;
  endAt: DateTime;
}

@doc("Calendar slot for the selected week. Free slots can be booked only when eventTypeId is selected in the request.")
model CalendarSlot {
  startAt: DateTime;
  endAt: DateTime;
  status: CalendarSlotStatus;
  eventTypeId?: string;
  booking?: PublicBookingSummary;
}

@doc("Full booking data available to the admin.")
model Booking {
  id: string;
  eventTypeId: string;
  eventTypeTitle: string;
  title: string;
  guestName: string;
  guestEmail: string;
  comment?: string;
  startAt: DateTime;
  endAt: DateTime;
  createdAt: DateTime;
}

model CreateBookingRequest {
  eventTypeId: string;
  startAt: DateTime;
  title: string;
  guestName: string;
  guestEmail: string;
  comment?: string;
}

model CreatedBookingResponse {
  @statusCode statusCode: 201;
  @body booking: Booking;
}

model RequestDeletionCodeRequest {
  guestEmail: string;
}

@doc("The response is intentionally generic so that the API does not reveal whether the email matches the booking.")
model DeletionCodeRequested {
  message: string;
}

model DeletionCodeRequestedResponse {
  @statusCode statusCode: 202;
  @body result: DeletionCodeRequested;
}

model DeleteBookingRequest {
  guestEmail: string;
  code: string;
}

model AdminLoginRequest {
  login: string;
  password: string;
}

model AdminSession {
  token: string;
  expiresAt?: DateTime;
}

@tag("Guest")
@route("/event-types")
@get
@doc("Returns event types available for guest booking. If the list is empty, the guest UI must show that booking is unavailable.")
op listEventTypes(): EventType[];

@tag("Guest")
@route("/calendar/slots")
@get
@doc("Returns weekly calendar slots clipped to the nearest 14-day booking window. Past time today and time outside availability are returned as unavailable.")
op listCalendarSlots(
  @query
  @doc("Optional event type filter. Without it, the calendar is read-only and shows occupied slots across all event types.")
  eventTypeId?: string,

  @query
  @doc("Requested week start date. Navigation outside the nearest 14-day booking window is not allowed.")
  weekStartDate?: Date,
): CalendarSlot[] | ValidationErrorResponse | NotFoundErrorResponse;

@tag("Guest")
@route("/bookings")
@post
@doc("Creates a booking for a free slot. The backend must re-check availability and reject any interval intersecting with existing bookings of any event type.")
op createBooking(
  @body request: CreateBookingRequest,
): CreatedBookingResponse | ValidationErrorResponse | NotFoundErrorResponse | SlotConflictErrorResponse | SlotUnavailableErrorResponse;

@tag("Guest")
@route("/bookings/{bookingId}/deletion-code")
@post
@doc("Requests a deletion confirmation code for the guest email associated with the booking. In dev mode the code can be exposed through logs or a local dev interface.")
op requestBookingDeletionCode(
  @path bookingId: string,
  @body request: RequestDeletionCodeRequest,
): DeletionCodeRequestedResponse | ValidationErrorResponse | NotFoundErrorResponse;

@tag("Guest")
@route("/bookings/{bookingId}")
@delete
@doc("Deletes a guest booking only when guestEmail matches the booking and code is valid.")
op deleteBooking(
  @path bookingId: string,
  @body request: DeleteBookingRequest,
): NoContentResponse | ValidationErrorResponse | UnauthorizedErrorResponse | NotFoundErrorResponse;

@tag("Admin")
@route("/admin/login")
@post
@doc("Authenticates the single predefined calendar owner using credentials hardcoded by the implementation.")
op adminLogin(
  @body request: AdminLoginRequest,
): AdminSession | ValidationErrorResponse | UnauthorizedErrorResponse;

@tag("Admin")
@route("/admin/event-types")
@get
@doc("Returns all event types for admin management.")
op listAdminEventTypes(
  ...AdminAuthHeader,
): EventType[] | UnauthorizedErrorResponse;

@tag("Admin")
@route("/admin/event-types")
@post
@doc("Creates an event type. The system assigns id and color.")
op createEventType(
  ...AdminAuthHeader,
  @body request: CreateEventTypeRequest,
): CreatedEventTypeResponse | ValidationErrorResponse | UnauthorizedErrorResponse;

@tag("Admin")
@route("/admin/event-types/{eventTypeId}")
@patch
@doc("Updates an event type. Existing bookings are not changed.")
op updateEventType(
  ...AdminAuthHeader,
  @path eventTypeId: string,
  @body request: UpdateEventTypeRequest,
): EventType | ValidationErrorResponse | UnauthorizedErrorResponse | NotFoundErrorResponse;

@tag("Admin")
@route("/admin/event-types/{eventTypeId}")
@delete
@doc("Deletes an event type only if it has no future bookings.")
op deleteEventType(
  ...AdminAuthHeader,
  @path eventTypeId: string,
): NoContentResponse | UnauthorizedErrorResponse | NotFoundErrorResponse | EventTypeHasFutureBookingsErrorResponse;

@tag("Admin")
@route("/admin/availability")
@get
@doc("Returns global availability settings shared by all event types.")
op getAvailabilitySettings(
  ...AdminAuthHeader,
): AvailabilitySettings | UnauthorizedErrorResponse;

@tag("Admin")
@route("/admin/availability")
@put
@doc("Updates global availability settings. endTime must be later than startTime. Existing bookings are not changed.")
op updateAvailabilitySettings(
  ...AdminAuthHeader,
  @body request: UpdateAvailabilitySettingsRequest,
): AvailabilitySettings | ValidationErrorResponse | UnauthorizedErrorResponse;

@tag("Admin")
@route("/admin/bookings/upcoming")
@get
@doc("Returns future bookings across all event types sorted by startAt ascending. Past booking history is not exposed in the MVP UI.")
op listUpcomingBookings(
  ...AdminAuthHeader,
): Booking[] | UnauthorizedErrorResponse;

@tag("Admin")
@route("/admin/bookings/{bookingId}")
@delete
@doc("Deletes any booking as admin without an email confirmation code.")
op deleteBookingAsAdmin(
  ...AdminAuthHeader,
  @path bookingId: string,
): NoContentResponse | UnauthorizedErrorResponse | NotFoundErrorResponse;
