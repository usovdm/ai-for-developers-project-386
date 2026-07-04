import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/shared/api";
import { calendarQueryKeys } from "@/features/calendar/queries";

export const bookingQueryKeys = {
  upcoming: ["bookings", "upcoming"] as const,
};

export function useUpcomingBookingsQuery() {
  return useQuery({
    queryKey: bookingQueryKeys.upcoming,
    queryFn: bookingsApi.listUpcoming,
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingsApi.create,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["calendar", "slots"] });
    },
  });
}

export function useDeleteBookingAsAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingsApi.deleteAsAdmin,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.upcoming });
      void queryClient.invalidateQueries({ queryKey: calendarQueryKeys.slots() });
    },
  });
}
