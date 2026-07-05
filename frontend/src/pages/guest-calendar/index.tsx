import { addDays, format, parseISO } from "date-fns";
import type { FormEvent } from "react";
import { useState } from "react";
import { useCalendarSlotsQuery } from "@/features/calendar/queries";
import {
  useCreateBookingMutation,
  useDeleteBookingAsGuestMutation,
  useRequestDeletionCodeMutation,
} from "@/features/bookings/queries";
import { usePublicEventTypesQuery } from "@/features/event-types/queries";
import { getErrorMessage, type CalendarSlot, type EventType, type PublicBookingSummary } from "@/shared/api";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

type BookingForm = {
  title: string;
  guestName: string;
  guestEmail: string;
  comment: string;
};

const initialBookingForm: BookingForm = {
  title: "",
  guestName: "",
  guestEmail: "",
  comment: "",
};

const colorClassName: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  green: "border-green-200 bg-green-50 text-green-800",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  purple: "border-purple-200 bg-purple-50 text-purple-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

export function GuestCalendarPage() {
  const [eventTypeId, setEventTypeId] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookingSlot, setBookingSlot] = useState<CalendarSlot | null>(null);
  const [deleteBooking, setDeleteBooking] = useState<PublicBookingSummary | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>(initialBookingForm);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteCode, setDeleteCode] = useState("");

  const eventTypesQuery = usePublicEventTypesQuery();
  const weekStartDate = format(addDays(new Date(), weekOffset), "yyyy-MM-dd");
  const slotsQuery = useCalendarSlotsQuery(eventTypeId || undefined, weekStartDate);
  const createBookingMutation = useCreateBookingMutation();
  const requestDeletionCodeMutation = useRequestDeletionCodeMutation();
  const deleteBookingMutation = useDeleteBookingAsGuestMutation();

  const eventTypes = eventTypesQuery.data ?? [];
  const slots = slotsQuery.data ?? [];
  const selectedEventType = eventTypes.find((eventType) => eventType.id === eventTypeId);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!bookingSlot || !selectedEventType) {
      return;
    }

    await createBookingMutation.mutateAsync({
      eventTypeId: selectedEventType.id,
      startAt: bookingSlot.startAt,
      title: bookingForm.title,
      guestName: bookingForm.guestName,
      guestEmail: bookingForm.guestEmail,
      comment: bookingForm.comment || undefined,
    });

    setBookingSlot(null);
    setBookingForm(initialBookingForm);
  }

  async function requestDeletionCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deleteBooking) {
      return;
    }

    await requestDeletionCodeMutation.mutateAsync({ bookingId: deleteBooking.id, guestEmail: deleteEmail });
  }

  async function submitDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deleteBooking) {
      return;
    }

    await deleteBookingMutation.mutateAsync({ bookingId: deleteBooking.id, guestEmail: deleteEmail, code: deleteCode });
    setDeleteBooking(null);
    setDeleteEmail("");
    setDeleteCode("");
  }

  function openSlot(slot: CalendarSlot) {
    createBookingMutation.reset();
    requestDeletionCodeMutation.reset();
    deleteBookingMutation.reset();

    if (slot.status === "occupied" && slot.booking) {
      setDeleteBooking(slot.booking);
      setBookingSlot(null);
      return;
    }

    if (slot.status === "free" && selectedEventType) {
      setBookingSlot(slot);
      setDeleteBooking(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Guest</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Book a meeting</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Choose an event type to book a free slot. Overview mode is read-only and shows occupied slots across all types.
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

        {selectedEventType ? <EventTypeDetails eventType={selectedEventType} /> : null}
        {eventTypes.length > 0 && !selectedEventType ? (
          <p className="text-sm text-slate-600">Select an event type to create bookings.</p>
        ) : null}
        {eventTypesQuery.isLoading ? <p className="text-sm text-slate-500">Loading event types...</p> : null}
        {!eventTypesQuery.isLoading && eventTypes.length === 0 ? (
          <p className="rounded-md bg-slate-100 p-4 text-sm text-slate-600">Booking is not available yet.</p>
        ) : null}
      </Card>

      {eventTypes.length > 0 ? (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Calendar week</p>
            <p className="font-medium text-slate-950">
              {format(addDays(new Date(), weekOffset), "dd MMM yyyy")} - {format(addDays(new Date(), weekOffset + 6), "dd MMM yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={weekOffset === 0} onClick={() => setWeekOffset(0)} aria-label="Previous week">
              Previous week
            </Button>
            <Button variant="secondary" disabled={weekOffset >= 7} onClick={() => setWeekOffset(7)} aria-label="Next week">
              Next week
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <SlotCard key={`${slot.startAt}-${slot.endAt}`} slot={slot} eventTypes={eventTypes} canBook={Boolean(selectedEventType)} onOpen={openSlot} />
        ))}
      </div>

      {slotsQuery.isLoading ? <p className="text-sm text-slate-500">Loading calendar...</p> : null}
      {slotsQuery.isError ? <p className="text-sm text-red-600">{getErrorMessage(slotsQuery.error)}</p> : null}

      {bookingSlot && selectedEventType ? (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-lg space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Create booking</h2>
              <p className="mt-1 text-sm text-slate-600">
                {selectedEventType.title} / {format(parseISO(bookingSlot.startAt), "dd MMM yyyy HH:mm")}
              </p>
            </div>
            <form className="space-y-3" onSubmit={submitBooking}>
              <Field label="Booking title" value={bookingForm.title} onChange={(title) => setBookingForm((value) => ({ ...value, title }))} />
              <Field label="Guest name" value={bookingForm.guestName} onChange={(guestName) => setBookingForm((value) => ({ ...value, guestName }))} />
              <Field label="Guest email" type="email" value={bookingForm.guestEmail} onChange={(guestEmail) => setBookingForm((value) => ({ ...value, guestEmail }))} />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="booking-comment">
                  Comment
                </label>
                <Textarea id="booking-comment" value={bookingForm.comment} onChange={(event) => setBookingForm((value) => ({ ...value, comment: event.target.value }))} />
              </div>
              {createBookingMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(createBookingMutation.error)}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={createBookingMutation.isPending}>
                  Create booking
                </Button>
                <Button variant="secondary" onClick={() => setBookingSlot(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {deleteBooking ? (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-lg space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Delete booking</h2>
              <p className="mt-1 text-sm text-slate-600">
                {deleteBooking.title} / {deleteBooking.eventTypeTitle} / {format(parseISO(deleteBooking.startAt), "dd MMM yyyy HH:mm")}
              </p>
            </div>
            <form className="space-y-3" onSubmit={requestDeletionCode}>
              <Field label="Booking email" type="email" value={deleteEmail} onChange={setDeleteEmail} />
              <Button type="submit" variant="secondary" disabled={requestDeletionCodeMutation.isPending}>
                Request deletion code
              </Button>
              {requestDeletionCodeMutation.isSuccess ? (
                <p className="text-sm text-green-700">{requestDeletionCodeMutation.data.message}</p>
              ) : null}
              {requestDeletionCodeMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(requestDeletionCodeMutation.error)}</p> : null}
            </form>
            <form className="space-y-3" onSubmit={submitDelete}>
              <Field label="Deletion code" value={deleteCode} onChange={setDeleteCode} />
              {deleteBookingMutation.isError ? <p className="text-sm text-red-600">{getErrorMessage(deleteBookingMutation.error)}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" variant="danger" disabled={deleteBookingMutation.isPending}>
                  Delete booking
                </Button>
                <Button variant="secondary" onClick={() => setDeleteBooking(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </section>
  );
}

function EventTypeDetails({ eventType }: { eventType: EventType }) {
  return (
    <div className="rounded-md bg-slate-100 p-4 text-sm text-slate-700">
      <p className="font-medium text-slate-950">{eventType.title}</p>
      <p className="mt-1">{eventType.description}</p>
      <p className="mt-1">{eventType.durationMinutes} min</p>
    </div>
  );
}

function SlotCard({
  slot,
  eventTypes,
  canBook,
  onOpen,
}: {
  slot: CalendarSlot;
  eventTypes: EventType[];
  canBook: boolean;
  onOpen: (slot: CalendarSlot) => void;
}) {
  const eventType = eventTypes.find((item) => item.id === slot.booking?.eventTypeId);
  const canOpen = slot.status === "occupied" || (slot.status === "free" && canBook);

  return (
    <button
      type="button"
      disabled={!canOpen}
      onClick={() => onOpen(slot)}
      className={cn(
        "rounded-xl border bg-white p-5 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70",
        canOpen ? "hover:border-blue-300 hover:shadow-md" : "",
        slot.status === "occupied" && eventType ? colorClassName[eventType.color] : "",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-950">{format(parseISO(slot.startAt), "dd MMM HH:mm")}</p>
          <p className="text-sm text-slate-500">{format(parseISO(slot.endAt), "HH:mm")}</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">{slot.status}</span>
      </div>
      {slot.booking ? (
        <p className="mt-3 text-sm text-slate-700">
          {slot.booking.title} / {slot.booking.eventTypeTitle}
        </p>
      ) : null}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = label.toLowerCase().split(" ").join("-");

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
