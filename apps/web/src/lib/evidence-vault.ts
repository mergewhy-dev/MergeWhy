import { createHash } from "crypto";
import { prisma } from "@mergewhy/database";
import { evaluateCompliance, buildDEREvidence, type ComplianceResult } from "./compliance-engines";

interface PRSnapshot {
  title: string;
  number: number;
  url: string;
  author: string;
  authorAvatar: string | null;
  description: string | null;
  baseBranch: string;
  headBranch: string;
  mergedAt: Date;
  mergedBy: string;
}

interface CodeSnapshot {
  filesChanged: string[];
  fileCount: number;
}

interface TicketSnapshot {
  id: string;
  source: string;
  url: string | null;
}

interface ReviewSnapshot {
  author: string;
  state: string;
  body: string | null;
  submittedAt: Date;
}

interface ApprovalSnapshot {
  author: string;
  submittedAt: Date;
}

interface SlackSnapshot {
  url: string;
}

interface AIAnalysisSnapshot {
  docQuality: string | null;
  intentAlignment: string | null;
  auditReadiness: string | null;
  summary: string | null;
  missingContext: string[];
  suggestions: string[];
}

interface GapSnapshot {
  type: string;
  severity: string;
  message: string;
  resolved: boolean;
}

interface ComplianceSnapshot {
  enabledFrameworks: string[];
  evaluatedAt: string;
  results: ComplianceResult[];
}

interface VaultData {
  pr: PRSnapshot;
  code: CodeSnapshot;
  tickets: TicketSnapshot[];
  reviews: ReviewSnapshot[];
  approvals: ApprovalSnapshot[];
  slackThreads: SlackSnapshot[];
  aiAnalysis: AIAnalysisSnapshot;
  evidenceScore: number;
  gaps: GapSnapshot[];
  compliance: ComplianceSnapshot | null;
  capturedAt: string;
  version: string;
}

/**
 * Create an immutable, cryptographically sealed evidence vault for a merged PR
 * This is the core value of MergeWhy - providing auditors with tamper-proof evidence
 */
export async function createEvidenceVault(
  derId: string,
  mergedBy: string
): Promise<string> {
  console.log(`[Evidence Vault] Creating vault for DER ${derId}...`);

  // 1. Fetch the DER with all related data
  const der = await prisma.decisionEvidenceRecord.findUnique({
    where: { id: derId },
    include: {
      repository: true,
      reviews: true,
      gaps: true,
      evidenceItems: true,
      comments: true,
      confirmations: {
        include: { user: true },
      },
    },
  });

  if (!der) {
    throw new Error(`DER not found: ${derId}`);
  }

  // Check if vault already exists
  const existingVault = await prisma.evidenceVault.findUnique({
    where: { decisionRecordId: derId },
  });

  if (existingVault) {
    console.log(`[Evidence Vault] Vault already exists for DER ${derId}: ${existingVault.id}`);
    return existingVault.id;
  }

  // 2. Compile all evidence into a structured package
  const now = new Date();
  const mergedAt = der.prMergedAt || now;

  const prSnapshot: PRSnapshot = {
    title: der.prTitle,
    number: der.prNumber,
    url: der.prUrl,
    author: der.prAuthor,
    authorAvatar: der.prAuthorAvatar,
    description: der.description,
    baseBranch: der.prBaseBranch,
    headBranch: der.prHeadBranch,
    mergedAt: mergedAt,
    mergedBy: mergedBy,
  };

  const codeSnapshot: CodeSnapshot = {
    filesChanged: der.filesChanged || [],
    fileCount: der.filesChanged?.length || 0,
  };

  // Parse ticket links to structured format
  const ticketSnapshot: TicketSnapshot[] = der.ticketLinks.map((link) => {
    // Try to identify the source
    let source = "unknown";
    if (link.includes("jira") || /[A-Z]+-\d+/.test(link)) {
      source = "jira";
    } else if (link.includes("linear")) {
      source = "linear";
    } else if (link.includes("github.com") && link.includes("/issues/")) {
      source = "github";
    }

    return {
      id: link,
      source,
      url: link.startsWith("http") ? link : null,
    };
  });

  const reviewsSnapshot: ReviewSnapshot[] = der.reviews.map((r) => ({
    author: r.author,
    state: r.state,
    body: r.body,
    submittedAt: r.submittedAt,
  }));

  const approvalsSnapshot: ApprovalSnapshot[] = der.reviews
    .filter((r) => r.state === "APPROVED")
    .map((r) => ({
      author: r.author,
      submittedAt: r.submittedAt,
    }));

  const slackSnapshot: SlackSnapshot[] = der.slackThreads.map((url) => ({
    url,
  }));

  const aiAnalysisSnapshot: AIAnalysisSnapshot = {
    docQuality: der.aiDocQuality,
    intentAlignment: der.aiIntentAlignment,
    auditReadiness: der.aiAuditReadiness,
    summary: der.aiSummary,
    missingContext: der.aiMissingContext || [],
    suggestions: der.aiSuggestions || [],
  };

  const gapsSnapshot: GapSnapshot[] = der.gaps.map((g) => ({
    type: g.type,
    severity: g.severity,
    message: g.message,
    resolved: g.resolved,
  }));

  // 2a. Evaluate compliance against enabled frameworks
  let complianceSnapshot: ComplianceSnapshot | null = null;

  const orgFrameworks = await prisma.organizationFramework.findMany({
    where: {
      organizationId: der.organizationId,
      isActive: true,
    },
    include: {
      framework: true,
    },
  });

  if (orgFrameworks.length > 0) {
    const enabledFrameworkCodes = orgFrameworks.map((of) => of.framework.shortCode);

    // Build evidence for compliance evaluation
    const evidence = buildDEREvidence({
      description: der.description,
      ticketLinks: der.ticketLinks,
      slackThreads: der.slackThreads,
      prAuthor: der.prAuthor,
      filesChanged: der.filesChanged,
      aiDocQuality: der.aiDocQuality,
      aiAuditReadiness: der.aiAuditReadiness,
      reviews: der.reviews.map((r) => ({
        author: r.author,
        state: r.state,
      })),
      gaps: der.gaps.map((g) => ({
        resolved: g.resolved,
      })),
    });

    const complianceResults = evaluateCompliance(evidence, enabledFrameworkCodes);

    complianceSnapshot = {
      enabledFrameworks: enabledFrameworkCodes,
      evaluatedAt: now.toISOString(),
      results: complianceResults,
    };

    console.log(`[Evidence Vault] Evaluated compliance against ${enabledFrameworkCodes.length} framework(s)`);
  }

  // Compile complete vault data
  const vaultData: VaultData = {
    pr: prSnapshot,
    code: codeSnapshot,
    tickets: ticketSnapshot,
    reviews: reviewsSnapshot,
    approvals: approvalsSnapshot,
    slackThreads: slackSnapshot,
    aiAnalysis: aiAnalysisSnapshot,
    evidenceScore: der.evidenceScore,
    gaps: gapsSnapshot,
    compliance: complianceSnapshot,
    capturedAt: now.toISOString(),
    version: "1.1.0", // Bumped version for compliance addition
  };

  // 3. Calculate SHA-256 hash for integrity verification
  // IMPORTANT: Use consistent JSON.stringify (no pretty-printing) to ensure hash matches on verification
  const snapshotJson = JSON.stringify(vaultData);
  const hash = createHash("sha256").update(snapshotJson).digest("hex");

  console.log(`[Evidence Vault] Compiled ${der.reviews.length} reviews, ${der.gaps.length} gaps, ${der.ticketLinks.length} tickets`);
  console.log(`[Evidence Vault] Hash: ${hash.substring(0, 16)}...`);

  // 4. Create and seal the vault
  // Parse the exact JSON that was hashed to ensure consistency
  const parsedSnapshotData = JSON.parse(snapshotJson);

  const vault = await prisma.evidenceVault.create({
    data: {
      decisionRecordId: derId,
      organizationId: der.organizationId,
      snapshotData: parsedSnapshotData,
      snapshotHash: hash,
      prSnapshot: JSON.parse(JSON.stringify(prSnapshot)),
      codeSnapshot: JSON.parse(JSON.stringify(codeSnapshot)),
      ticketSnapshot: JSON.parse(JSON.stringify(ticketSnapshot)),
      reviewsSnapshot: JSON.parse(JSON.stringify(reviewsSnapshot)),
      approvalsSnapshot: JSON.parse(JSON.stringify(approvalsSnapshot)),
      slackSnapshot: JSON.parse(JSON.stringify(slackSnapshot)),
      aiAnalysisSnapshot: JSON.parse(JSON.stringify(aiAnalysisSnapshot)),
      mergedAt: mergedAt,
      mergedBy: mergedBy,
      isSealed: true,
      sealedAt: now,
      sealedBy: "system",
    },
  });

  // 5. Update DER status to COMPLETE
  await prisma.decisionEvidenceRecord.update({
    where: { id: derId },
    data: { status: "COMPLETE" },
  });

  console.log(`[Evidence Vault] Created and sealed vault ${vault.id} for DER ${derId}`);

  return vault.id;
}

/**
 * Verify the integrity of an evidence vault by recalculating the hash
 * Returns true if the data hasn't been tampered with
 */
export async function verifyVaultIntegrity(
  vaultId: string
): Promise<{ valid: boolean; reason?: string }> {
  const vault = await prisma.evidenceVault.findUnique({
    where: { id: vaultId },
  });

  if (!vault) {
    return { valid: false, reason: "Vault not found" };
  }

  if (!vault.isSealed) {
    return { valid: false, reason: "Vault is not sealed" };
  }

  // Recalculate hash from stored data
  // IMPORTANT: Use same JSON.stringify options as when creating (no pretty-printing)
  const recalculatedHash = createHash("sha256")
    .update(JSON.stringify(vault.snapshotData))
    .digest("hex");

  if (recalculatedHash !== vault.snapshotHash) {
    console.error(`[Evidence Vault] Hash mismatch for vault ${vaultId}`);
    console.error(`[Evidence Vault] Stored hash: ${vault.snapshotHash}`);
    console.error(`[Evidence Vault] Calculated hash: ${recalculatedHash}`);
    return {
      valid: false,
      reason: "Hash mismatch - evidence may have been tampered with",
    };
  }

  console.log(`[Evidence Vault] Integrity verified for vault ${vaultId}`);
  return { valid: true };
}

/**
 * Get vault details for display
 */
export async function getVaultSummary(vaultId: string) {
  const vault = await prisma.evidenceVault.findUnique({
    where: { id: vaultId },
    include: {
      decisionRecord: {
        select: {
          prTitle: true,
          prNumber: true,
          prUrl: true,
        },
      },
    },
  });

  if (!vault) {
    return null;
  }

  const data = vault.snapshotData as unknown as VaultData;

  // Calculate compliance summary
  let complianceSummary = null;
  if (data.compliance && data.compliance.results.length > 0) {
    const totalFrameworks = data.compliance.results.length;
    const compliantFrameworks = data.compliance.results.filter(
      (r) => r.overallStatus === "COMPLIANT"
    ).length;
    const partialFrameworks = data.compliance.results.filter(
      (r) => r.overallStatus === "PARTIAL"
    ).length;

    complianceSummary = {
      enabledFrameworks: data.compliance.enabledFrameworks,
      evaluatedAt: data.compliance.evaluatedAt,
      totalFrameworks,
      compliantFrameworks,
      partialFrameworks,
      nonCompliantFrameworks: totalFrameworks - compliantFrameworks - partialFrameworks,
      results: data.compliance.results.map((r) => ({
        frameworkId: r.frameworkId,
        frameworkName: r.frameworkName,
        frameworkIcon: r.frameworkIcon,
        overallStatus: r.overallStatus,
        score: r.score,
        controlsPassed: r.controlResults.filter((c) => c.status === "PASS").length,
        controlsTotal: r.controlResults.length,
      })),
    };
  }

  return {
    id: vault.id,
    hash: vault.snapshotHash,
    hashShort: vault.snapshotHash.substring(0, 16),
    isSealed: vault.isSealed,
    sealedAt: vault.sealedAt,
    sealedBy: vault.sealedBy,
    mergedAt: vault.mergedAt,
    mergedBy: vault.mergedBy,
    prTitle: vault.decisionRecord.prTitle,
    prNumber: vault.decisionRecord.prNumber,
    prUrl: vault.decisionRecord.prUrl,
    evidenceScore: data.evidenceScore,
    reviewCount: data.reviews.length,
    approvalCount: data.approvals.length,
    ticketCount: data.tickets.length,
    gapCount: data.gaps.filter((g) => !g.resolved).length,
    compliance: complianceSummary,
    version: data.version,
  };
}
