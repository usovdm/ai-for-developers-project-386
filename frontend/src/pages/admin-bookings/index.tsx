import { format, parseISO } from "date-fns";
import { useDeleteBookingAsAdminMutation, useUpcomingBookingsQuery } from "@/features/bookings/queries";
import { getErrorMessage } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export function AdminBookingsPage() {
  const bookingsQuery = useUpcomingBookingsQuery();
  const deleteMutation = useDeleteBookingAsAdminMutation();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Upcoming bookings</h1>
      </div>

      <div className="space-y-3">
        {(bookingsQuery.data ?? []).map((booking) => (
          <Card key={booking.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-950">{booking.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {format(parseISO(booking.startAt), "dd MMM yyyy HH:mm")} / {booking.eventTypeTitle}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {booking.guestName} / {booking.guestEmail}
                </p>
                {booking.comment ? <p className="mt-1 text-sm text-slate-600">{booking.comment}</p> : null}
              </div>
              <Button variant="danger" onClick={() => deleteMutation.mutate(booking.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}

        {bookingsQuery.isLoading ? <p className="text-sm text-slate-500">Loading bookings...</p> : null}
        {bookingsQuery.isError ? <p className="text-sm text-red-600">{getErrorMessage(bookingsQuery.error)}</p> : null}
      </div>
    </section>
  );
}
