import { getAdminToken } from "@/shared/lib/admin-session";
import { apiRequest } from "../client";
import type {
  Booking,
  CreateBookingRequest,
  DeleteBookingRequest,
  RequestDeletionCodeRequest,
} from "../types";

export const bookingsApi = {
  create(request: CreateBookingRequest) {
    return apiRequest<Booking>("/bookings", {
      method: "POST",
      body: request,
    });
  },

  requestDeletionCode(bookingId: string, request: RequestDeletionCodeRequest) {
    return apiRequest<{ message: string }>(`/bookings/${bookingId}/deletion-code`, {
      method: "POST",
      body: request,
    });
  },

  deleteAsGuest(bookingId: string, request: DeleteBookingRequest) {
    return apiRequest<void>(`/bookings/${bookingId}`, {
      method: "DELETE",
      body: request,
    });
  },

  listUpcoming() {
    return apiRequest<Booking[]>("/admin/bookings/upcoming", {
      token: getAdminToken(),
    });
  },

  deleteAsAdmin(bookingId: string) {
    return apiRequest<void>(`/admin/bookings/${bookingId}`, {
      method: "DELETE",
      token: getAdminToken(),
    });
  },
};
