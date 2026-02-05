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

export function useGenerateAuditSummary() {
  const utils = trpc.useUtils();
  return trpc.der.generateAuditSummary.useMutation({
    onSuccess: () => {
      utils.der.getById.invalidate();
    },
  });
}

export function useReanalyzeRisk() {
  const utils = trpc.useUtils();
  return trpc.der.reanalyzeRisk.useMutation({
    onSuccess: () => {
      utils.der.getById.invalidate();
      utils.der.list.invalidate();
      utils.der.getStats.invalidate();
    },
  });
}

export function useRecalculateScore() {
  const utils = trpc.useUtils();
  return trpc.der.recalculateScore.useMutation({
    onSuccess: () => {
      utils.der.getById.invalidate();
      utils.der.list.invalidate();
      utils.der.getStats.invalidate();
    },
  });
}

// Evidence Vault hooks

export function useVault(derId: string) {
  return trpc.der.getVault.useQuery({ derId }, { enabled: !!derId });
}

export function useVaultSummary(derId: string) {
  return trpc.der.getVaultSummary.useQuery({ derId }, { enabled: !!derId });
}

export function useVerifyVault() {
  return trpc.der.verifyVault.useMutation();
}

export function useCreateVault() {
  const utils = trpc.useUtils();
  return trpc.der.createVault.useMutation({
    onSuccess: (_, variables) => {
      utils.der.getById.invalidate({ id: variables.derId });
      utils.der.getVault.invalidate({ derId: variables.derId });
      utils.der.getVaultSummary.invalidate({ derId: variables.derId });
    },
  });
}
