import { getAdminToken } from "@/shared/lib/admin-session";
import { apiRequest } from "../client";
import type { AvailabilitySettings, UpdateAvailabilitySettingsRequest } from "../types";

export const availabilityApi = {
  get() {
    return apiRequest<AvailabilitySettings>("/admin/availability", {
      token: getAdminToken(),
    });
  },

  update(request: UpdateAvailabilitySettingsRequest) {
    return apiRequest<AvailabilitySettings>("/admin/availability", {
      method: "PUT",
      body: request,
      token: getAdminToken(),
    });
  },
};
