import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { availabilityApi } from "@/shared/api";

export const availabilityQueryKeys = {
  settings: ["availability", "settings"] as const,
};

export function useAvailabilitySettingsQuery() {
  return useQuery({
    queryKey: availabilityQueryKeys.settings,
    queryFn: availabilityApi.get,
  });
}

export function useUpdateAvailabilitySettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: availabilityApi.update,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.settings });
    },
  });
}
