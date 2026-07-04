import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/shared/api";
import { saveAdminToken } from "@/shared/lib/admin-session";

export function useAdminLoginMutation() {
  return useMutation({
    mutationFn: authApi.adminLogin,
    onSuccess(session) {
      saveAdminToken(session.token);
    },
  });
}
