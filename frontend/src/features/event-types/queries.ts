import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventTypesApi } from "@/shared/api";

export const eventTypeQueryKeys = {
  publicList: ["event-types", "public"] as const,
  adminList: ["event-types", "admin"] as const,
};

export function usePublicEventTypesQuery() {
  return useQuery({
    queryKey: eventTypeQueryKeys.publicList,
    queryFn: eventTypesApi.listPublic,
  });
}

export function useAdminEventTypesQuery() {
  return useQuery({
    queryKey: eventTypeQueryKeys.adminList,
    queryFn: eventTypesApi.listAdmin,
  });
}

export function useCreateEventTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventTypesApi.create,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: eventTypeQueryKeys.adminList });
      void queryClient.invalidateQueries({ queryKey: eventTypeQueryKeys.publicList });
    },
  });
}

export function useUpdateEventTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventTypeId, values }: { eventTypeId: string; values: Parameters<typeof eventTypesApi.update>[1] }) =>
      eventTypesApi.update(eventTypeId, values),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: eventTypeQueryKeys.adminList });
      void queryClient.invalidateQueries({ queryKey: eventTypeQueryKeys.publicList });
      void queryClient.invalidateQueries({ queryKey: ["calendar", "slots"] });
    },
  });
}

export function useDeleteEventTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventTypesApi.remove,
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: eventTypeQueryKeys.adminList });
      void queryClient.invalidateQueries({ queryKey: eventTypeQueryKeys.publicList });
    },
  });
}
