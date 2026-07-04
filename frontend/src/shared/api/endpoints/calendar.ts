import { apiRequest } from "../client";
import type { CalendarSlot, DateString } from "../types";

export type ListCalendarSlotsParams = {
  eventTypeId?: string;
  weekStartDate?: DateString;
};

export const calendarApi = {
  listSlots(params: ListCalendarSlotsParams) {
    return apiRequest<CalendarSlot[]>("/calendar/slots", {
      query: params,
    });
  },
};
