import { apiRequest } from "../client";
import type { AdminLoginRequest, AdminSession } from "../types";

export const authApi = {
  adminLogin(request: AdminLoginRequest) {
    return apiRequest<AdminSession>("/admin/login", {
      method: "POST",
      body: request,
    });
  },
};
