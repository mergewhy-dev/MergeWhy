import { trpc } from "@/lib/trpc";

export function useDERs(filters?: {
  status?: "PENDING" | "NEEDS_REVIEW" | "CONFIRMED" | "COMPLETE" | "INCOMPLETE";
  repositoryId?: string;
  search?: string;
}) {
  return trpc.der.list.useInfiniteQuery(
    { ...filters },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
}

export function useDER(id: string) {
  return trpc.der.getById.useQuery({ id }, { enabled: !!id });
}

export function useConfirmDER() {
  const utils = trpc.useUtils();
  return trpc.der.confirm.useMutation({
    onSuccess: () => {
      utils.der.list.invalidate();
      utils.der.getById.invalidate();
      utils.der.getStats.invalidate();
      utils.der.getNeedsAttention.invalidate();
    },
  });
}

export function useDERStats() {
  return trpc.der.getStats.useQuery();
}

export function useNeedsAttention() {
  return trpc.der.getNeedsAttention.useQuery();
}
