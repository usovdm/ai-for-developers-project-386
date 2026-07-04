export type EventDurationMinutes = 15 | 30 | 45;

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type EventTypeColor = "blue" | "green" | "yellow" | "orange" | "purple" | "red";

export type CalendarSlotStatus = "free" | "occupied" | "unavailable";

export type DateString = string;
export type DateTimeString = string;
export type TimeOfDay = string;

export type ApiErrorCode =
  | "validation_error"
  | "unauthorized"
  | "not_found"
  | "slot_conflict"
  | "event_type_has_future_bookings"
  | "slot_unavailable";

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: string;
};

export type EventType = {
  id: string;
  title: string;
  description: string;
  durationMinutes: EventDurationMinutes;
  color: EventTypeColor;
};

export type CreateEventTypeRequest = {
  title: string;
  description: string;
  durationMinutes: EventDurationMinutes;
};

export type UpdateEventTypeRequest = Partial<CreateEventTypeRequest>;

export type AvailabilitySettings = {
  workDays: DayOfWeek[];
  startTime: TimeOfDay;
  endTime: TimeOfDay;
};

export type UpdateAvailabilitySettingsRequest = AvailabilitySettings;

export type PublicBookingSummary = {
  id: string;
  eventTypeId: string;
  eventTypeTitle: string;
  title: string;
  startAt: DateTimeString;
  endAt: DateTimeString;
};

export type CalendarSlot = {
  startAt: DateTimeString;
  endAt: DateTimeString;
  status: CalendarSlotStatus;
  eventTypeId?: string;
  booking?: PublicBookingSummary;
};

export type Booking = {
  id: string;
  eventTypeId: string;
  eventTypeTitle: string;
  title: string;
  guestName: string;
  guestEmail: string;
  comment?: string;
  startAt: DateTimeString;
  endAt: DateTimeString;
  createdAt: DateTimeString;
};

export type CreateBookingRequest = {
  eventTypeId: string;
  startAt: DateTimeString;
  title: string;
  guestName: string;
  guestEmail: string;
  comment?: string;
};

export type RequestDeletionCodeRequest = {
  guestEmail: string;
};

export type DeleteBookingRequest = {
  guestEmail: string;
  code: string;
};

export type AdminLoginRequest = {
  login: string;
  password: string;
};

export type AdminSession = {
  token: string;
  expiresAt?: DateTimeString;
};
