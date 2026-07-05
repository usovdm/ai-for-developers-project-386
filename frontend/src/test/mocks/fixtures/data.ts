import { addMinutes, setHours, setMinutes, startOfToday } from "date-fns";
import type { AvailabilitySettings, Booking, CalendarSlot, DevEmail, EventType } from "@/shared/api";

export const eventTypes: EventType[] = [
  {
    id: "event-type-1",
    title: "Intro call",
    description: "Short meeting for first contact.",
    durationMinutes: 30,
    color: "blue",
  },
  {
    id: "event-type-2",
    title: "Product consultation",
    description: "Longer meeting for detailed discussion.",
    durationMinutes: 45,
    color: "purple",
  },
];

export let availabilitySettings: AvailabilitySettings = {
  workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  startTime: "09:00",
  endTime: "18:00",
};

const todayAtTen = setMinutes(setHours(startOfToday(), 10), 0);

export const bookings: Booking[] = [
  {
    id: "booking-1",
    eventTypeId: "event-type-1",
    eventTypeTitle: "Intro call",
    title: "Project discussion",
    guestName: "Demo Guest",
    guestEmail: "guest@example.com",
    comment: "Created by MSW fixture.",
    startAt: todayAtTen.toISOString(),
    endAt: addMinutes(todayAtTen, 30).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const devEmails: DevEmail[] = [];

export function setAvailabilitySettings(nextSettings: AvailabilitySettings) {
  availabilitySettings = nextSettings;
}

export function buildCalendarSlots(eventTypeId?: string): CalendarSlot[] {
  const base = startOfToday();
  const selectedEventType = eventTypes.find((eventType) => eventType.id === eventTypeId) ?? eventTypes[0];
  const durationMinutes = selectedEventType?.durationMinutes ?? 30;

  return Array.from({ length: 8 }, (_, index) => {
    const startAt = addMinutes(setHours(base, 9), index * durationMinutes);
    const endAt = addMinutes(startAt, durationMinutes);
    const booking = bookings.find((item) => item.startAt === startAt.toISOString());

    if (booking) {
      return {
        startAt: booking.startAt,
        endAt: booking.endAt,
        status: "occupied",
        eventTypeId: booking.eventTypeId,
        booking: {
          id: booking.id,
          eventTypeId: booking.eventTypeId,
          eventTypeTitle: booking.eventTypeTitle,
          title: booking.title,
          startAt: booking.startAt,
          endAt: booking.endAt,
        },
      };
    }

    return {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      status: eventTypeId ? "free" : "unavailable",
      eventTypeId,
    };
  });
}

export function findEventTypeTitle(eventTypeId: string) {
  return eventTypes.find((eventType) => eventType.id === eventTypeId)?.title ?? "Unknown event type";
}
