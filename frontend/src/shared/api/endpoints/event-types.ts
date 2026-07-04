import { getAdminToken } from "@/shared/lib/admin-session";
import { apiRequest } from "../client";
import type { CreateEventTypeRequest, EventType, UpdateEventTypeRequest } from "../types";

export const eventTypesApi = {
  listPublic() {
    return apiRequest<EventType[]>("/event-types");
  },

  listAdmin() {
    return apiRequest<EventType[]>("/admin/event-types", {
      token: getAdminToken(),
    });
  },

  create(request: CreateEventTypeRequest) {
    return apiRequest<EventType>("/admin/event-types", {
      method: "POST",
      body: request,
      token: getAdminToken(),
    });
  },

  update(eventTypeId: string, request: UpdateEventTypeRequest) {
    return apiRequest<EventType>(`/admin/event-types/${eventTypeId}`, {
      method: "PATCH",
      body: request,
      token: getAdminToken(),
    });
  },

  remove(eventTypeId: string) {
    return apiRequest<void>(`/admin/event-types/${eventTypeId}`, {
      method: "DELETE",
      token: getAdminToken(),
    });
  },
};
