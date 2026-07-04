import { useQuery } from "@tanstack/react-query";
import { calendarApi, type DateString } from "@/shared/api";

export const calendarQueryKeys = {
  slots: (eventTypeId?: string, weekStartDate?: DateString) =>
    ["calendar", "slots", eventTypeId ?? "all", weekStartDate ?? "current"] as const,
};

export function useCalendarSlotsQuery(eventTypeId?: string, weekStartDate?: DateString) {
  return useQuery({
    queryKey: calendarQueryKeys.slots(eventTypeId, weekStartDate),
    queryFn: () => calendarApi.listSlots({ eventTypeId, weekStartDate }),
  });
}
