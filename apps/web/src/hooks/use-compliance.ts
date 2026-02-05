import { trpc } from "@/lib/trpc";

export function useFrameworks() {
  return trpc.compliance.listFrameworks.useQuery();
}

export function useOrganizationFrameworks() {
  return trpc.compliance.getOrganizationFrameworks.useQuery();
}

export function useComplianceStatus() {
  return trpc.compliance.getComplianceStatus.useQuery();
}

export function useEnableFramework() {
  const utils = trpc.useUtils();
  return trpc.compliance.enableFramework.useMutation({
    onSuccess: () => {
      utils.compliance.getOrganizationFrameworks.invalidate();
      utils.compliance.getComplianceStatus.invalidate();
    },
  });
}

export function useDisableFramework() {
  const utils = trpc.useUtils();
  return trpc.compliance.disableFramework.useMutation({
    onSuccess: () => {
      utils.compliance.getOrganizationFrameworks.invalidate();
      utils.compliance.getComplianceStatus.invalidate();
    },
  });
}

export function useDERCompliance(derId: string) {
  return trpc.compliance.evaluateDER.useQuery(
    { derId },
    { enabled: !!derId }
  );
}
