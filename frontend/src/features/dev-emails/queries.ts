import { useQuery } from "@tanstack/react-query";
import { devEmailsApi } from "@/shared/api";

export const devEmailQueryKeys = {
  list: ["dev-emails"] as const,
};

export function useDevEmailsQuery() {
  return useQuery({
    queryKey: devEmailQueryKeys.list,
    queryFn: devEmailsApi.list,
  });
}
