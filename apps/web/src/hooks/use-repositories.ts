import { trpc } from "@/lib/trpc";

export function useRepositories() {
  return trpc.repository.list.useQuery();
}

export function useRepository(id: string) {
  return trpc.repository.getById.useQuery({ id }, { enabled: !!id });
}

export function useUpdateRepositorySettings() {
  const utils = trpc.useUtils();
  return trpc.repository.updateSettings.useMutation({
    onSuccess: () => {
      utils.repository.list.invalidate();
      utils.repository.getById.invalidate();
    },
  });
}

export function useRepositoryStats() {
  return trpc.repository.getStats.useQuery();
}
