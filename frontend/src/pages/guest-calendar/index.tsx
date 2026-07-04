import { format, parseISO } from "date-fns";
import { useState } from "react";
import { useCalendarSlotsQuery } from "@/features/calendar/queries";
import { usePublicEventTypesQuery } from "@/features/event-types/queries";
import { Card } from "@/shared/ui/card";

export function GuestCalendarPage() {
  const [eventTypeId, setEventTypeId] = useState("");
  const eventTypesQuery = usePublicEventTypesQuery();
  const slotsQuery = useCalendarSlotsQuery(eventTypeId || undefined);

  const eventTypes = eventTypesQuery.data ?? [];
  const slots = slotsQuery.data ?? [];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Guest</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Book a meeting</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          The guest page reads event types and calendar slots only through the API contract.
        </p>
      </div>

      <Card className="space-y-4">
        <label className="block text-sm font-medium text-slate-700" htmlFor="event-type-filter">
          Event type
        </label>
        <select
          id="event-type-filter"
          className="h-10 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={eventTypeId}
          onChange={(event) => setEventTypeId(event.target.value)}
        >
          <option value="">Overview mode</option>
          {eventTypes.map((eventType) => (
            <option key={eventType.id} value={eventType.id}>
              {eventType.title} - {eventType.durationMinutes} min
            </option>
          ))}
        </select>

        {eventTypesQuery.isLoading ? <p className="text-sm text-slate-500">Loading event types...</p> : null}
        {!eventTypesQuery.isLoading && eventTypes.length === 0 ? (
          <p className="rounded-md bg-slate-100 p-4 text-sm text-slate-600">Booking is not available yet.</p>
        ) : null}
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <Card key={`${slot.startAt}-${slot.endAt}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">{format(parseISO(slot.startAt), "dd MMM HH:mm")}</p>
                <p className="text-sm text-slate-500">{format(parseISO(slot.endAt), "HH:mm")}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {slot.status}
              </span>
            </div>
            {slot.booking ? (
              <p className="mt-3 text-sm text-slate-600">
                {slot.booking.title} / {slot.booking.eventTypeTitle}
              </p>
            ) : null}
          </Card>
        ))}
      </div>

      {slotsQuery.isLoading ? <p className="text-sm text-slate-500">Loading calendar...</p> : null}
    </section>
  );
}
