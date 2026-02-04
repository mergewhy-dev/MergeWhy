import { trpc } from "@/lib/trpc";

export function useSettings() {
  return trpc.settings.get.useQuery();
}

export function useUpdateSettings() {
  const utils = trpc.useUtils();
  return trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
    },
  });
}
