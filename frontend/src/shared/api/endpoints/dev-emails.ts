import { apiRequest } from "../client";
import type { DevEmail } from "../types";

export const devEmailsApi = {
  list() {
    return apiRequest<DevEmail[]>("/dev/emails");
  },
};
