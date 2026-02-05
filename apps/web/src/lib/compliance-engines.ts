/**
 * Framework-specific compliance evaluation engines for MergeWhy
 * Evaluates DERs against SOC 2, DORA, and ISO 27001 requirements
 */

export interface ComplianceResult {
  frameworkId: string;
  frameworkName: string;
  frameworkIcon: string;
  overallStatus: "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT";
  controlResults: ControlResult[];
  score: number; // 0-100
}

export interface ControlResult {
  controlId: string;
  controlName: string;
  category: string;
  status: "PASS" | "FAIL" | "WARNING";
  requirements: RequirementCheck[];
  recommendation?: string;
}

export interface RequirementCheck {
  name: string;
  required: boolean;
  met: boolean;
  detail: string;
}

export interface DEREvidence {
  hasDescription: boolean;
  descriptionLength: number;
  ticketCount: number;
  reviewCount: number;
  approvalCount: number;
  hasRiskAssessment: boolean;
  aiDocQuality: string | null;
  aiAuditReadiness: string | null;
  filesChanged: string[];
  hasSelfApproval: boolean; // author approved their own PR
  slackThreadCount: number;
  prAuthor: string;
  reviewers: string[];
  gapCount: number;
  unresolvedGapCount: number;
}

// ===== SOC 2 TYPE II ENGINE =====
function evaluateSOC2(evidence: DEREvidence): ComplianceResult {
  const controls: ControlResult[] = [];

  // CC6.1 - Logical Access Security
  const cc61Reqs: RequirementCheck[] = [
    {
      name: "Change authorized by someone other than author",
      required: true,
      met: evidence.approvalCount > 0 && !evidence.hasSelfApproval,
      detail: evidence.hasSelfApproval
        ? "Author approved their own PR - violates segregation of duties"
        : evidence.approvalCount > 0
        ? `Approved by ${evidence.approvalCount} reviewer(s)`
        : "No approvals found",
    },
    {
      name: "Code review performed",
      required: true,
      met: evidence.reviewCount > 0,
      detail:
        evidence.reviewCount > 0
          ? `${evidence.reviewCount} review(s) completed`
          : "No code reviews found",
    },
  ];

  const cc61Status = cc61Reqs.every((r) => !r.required || r.met)
    ? "PASS"
    : cc61Reqs.filter((r) => r.required && !r.met).length === 1
    ? "WARNING"
    : "FAIL";

  controls.push({
    controlId: "CC6.1",
    controlName: "Logical Access Security",
    category: "Security",
    status: cc61Status,
    requirements: cc61Reqs,
    recommendation:
      cc61Status !== "PASS"
        ? "Ensure all changes are reviewed and approved by someone other than the author to maintain segregation of duties."
        : undefined,
  });

  // CC7.1 - System Operations
  const cc71Reqs: RequirementCheck[] = [
    {
      name: "Change is documented",
      required: true,
      met: evidence.hasDescription,
      detail: evidence.hasDescription
        ? `Description provided (${evidence.descriptionLength} chars)`
        : "No description provided",
    },
    {
      name: "Change scope is clear",
      required: false,
      met: evidence.filesChanged.length > 0,
      detail: `${evidence.filesChanged.length} files changed`,
    },
  ];

  controls.push({
    controlId: "CC7.1",
    controlName: "System Operations",
    category: "Operations",
    status: cc71Reqs.every((r) => !r.required || r.met) ? "PASS" : "FAIL",
    requirements: cc71Reqs,
  });

  // CC8.1 - Change Management (Core SOC 2 control)
  const cc81Reqs: RequirementCheck[] = [
    {
      name: "Change is documented",
      required: true,
      met: evidence.hasDescription && evidence.descriptionLength > 50,
      detail: evidence.hasDescription
        ? `Description: ${evidence.descriptionLength} characters`
        : "No description provided",
    },
    {
      name: "Change is linked to business requirement",
      required: true,
      met: evidence.ticketCount > 0,
      detail:
        evidence.ticketCount > 0
          ? `${evidence.ticketCount} ticket(s) linked`
          : "No ticket linked - cannot trace to business requirement",
    },
    {
      name: "Change is approved before implementation",
      required: true,
      met: evidence.approvalCount > 0,
      detail:
        evidence.approvalCount > 0
          ? `${evidence.approvalCount} approval(s)`
          : "No approvals - change not formally authorized",
    },
    {
      name: "Segregation of duties maintained",
      required: true,
      met: !evidence.hasSelfApproval,
      detail: evidence.hasSelfApproval
        ? "VIOLATION: Author approved their own change"
        : "Author did not approve their own change",
    },
  ];

  const cc81Status = cc81Reqs.every((r) => !r.required || r.met)
    ? "PASS"
    : cc81Reqs.filter((r) => r.required && !r.met).length <= 1
    ? "WARNING"
    : "FAIL";

  controls.push({
    controlId: "CC8.1",
    controlName: "Change Management",
    category: "Change Management",
    status: cc81Status,
    requirements: cc81Reqs,
    recommendation:
      cc81Status !== "PASS"
        ? "Ensure changes have complete documentation, ticket links, and proper approvals before merging."
        : undefined,
  });

  const passed = controls.filter((c) => c.status === "PASS").length;
  const total = controls.length;

  return {
    frameworkId: "soc2",
    frameworkName: "SOC 2 Type II",
    frameworkIcon: "🛡️",
    overallStatus:
      passed === total ? "COMPLIANT" : passed > 0 ? "PARTIAL" : "NON_COMPLIANT",
    controlResults: controls,
    score: Math.round((passed / total) * 100),
  };
}

// ===== DORA ENGINE =====
function evaluateDORA(evidence: DEREvidence): ComplianceResult {
  const controls: ControlResult[] = [];

  // Detect sensitive files (financial/security)
  const sensitivePatterns = [
    "payment",
    "auth",
    "crypto",
    "security",
    "financial",
    "bank",
    "transaction",
    "transfer",
    "api/",
    "middleware",
    "config",
    "secret",
    "key",
    "token",
    "credential",
  ];

  const sensitiveFiles = evidence.filesChanged.filter((f) =>
    sensitivePatterns.some((p) => f.toLowerCase().includes(p))
  );
  const hasSensitiveChanges = sensitiveFiles.length > 0;

  // Art.9(4)(e) - ICT Change Management (STRICTER than SOC 2)
  const art9eReqs: RequirementCheck[] = [
    {
      name: "Change recorded in controlled manner",
      required: true,
      met: true, // Always true - we captured it via PR workflow
      detail: "Change recorded via PR workflow",
    },
    {
      name: "Change documented with rationale",
      required: true,
      met: evidence.hasDescription && evidence.descriptionLength > 100,
      detail:
        evidence.descriptionLength > 100
          ? "Adequate documentation provided"
          : "DORA requires detailed change documentation - description too brief",
    },
    {
      name: "Risk assessment performed",
      required: true,
      met: evidence.hasRiskAssessment || evidence.aiDocQuality !== null,
      detail:
        evidence.hasRiskAssessment || evidence.aiDocQuality !== null
          ? `Documentation quality: ${evidence.aiDocQuality || "Assessed"}`
          : "DORA Article 9(4)(e) requires risk assessment for all ICT changes",
    },
    {
      name: "Change approved by authorized personnel",
      required: true,
      met: evidence.approvalCount > 0 && !evidence.hasSelfApproval,
      detail:
        evidence.approvalCount > 0
          ? `Approved by ${evidence.approvalCount} reviewer(s)`
          : "Change not approved - DORA requires formal authorization",
    },
    {
      name: "Linked to business requirement",
      required: true,
      met: evidence.ticketCount > 0,
      detail:
        evidence.ticketCount > 0
          ? "Traceable to business requirement via ticket"
          : "DORA requires traceable path from requirement to change",
    },
  ];

  // Extra requirement for sensitive financial files
  if (hasSensitiveChanges) {
    art9eReqs.push({
      name: "Enhanced review for financial/sensitive changes",
      required: true,
      met: evidence.reviewCount >= 2,
      detail: `Sensitive files modified (${sensitiveFiles.length}): requires 2+ reviewers, has ${evidence.reviewCount}`,
    });
  }

  const art9eStatus = art9eReqs.every((r) => !r.required || r.met)
    ? "PASS"
    : art9eReqs.filter((r) => r.required && !r.met).length <= 1
    ? "WARNING"
    : "FAIL";

  controls.push({
    controlId: "Art.9(4)(e)",
    controlName: "ICT Change Management",
    category: "Operations",
    status: art9eStatus,
    requirements: art9eReqs,
    recommendation: hasSensitiveChanges
      ? "This change touches financial/sensitive files - ensure enhanced review process with 2+ reviewers"
      : art9eStatus !== "PASS"
      ? "DORA requires comprehensive change management including risk assessment and formal authorization"
      : undefined,
  });

  // Art.9(4)(c) - ICT Risk Assessment
  const art9cReqs: RequirementCheck[] = [
    {
      name: "Risk assessment documented",
      required: true,
      met: evidence.hasRiskAssessment || evidence.aiDocQuality !== null,
      detail:
        evidence.hasRiskAssessment || evidence.aiDocQuality !== null
          ? `Audit readiness: ${evidence.aiAuditReadiness || "Assessed"}`
          : "No risk assessment - DORA mandates risk evaluation for ICT changes",
    },
    {
      name: "Change impact analyzed",
      required: true,
      met: evidence.hasDescription && evidence.descriptionLength > 50,
      detail: evidence.hasDescription
        ? "Impact documented in description"
        : "Change impact not documented",
    },
  ];

  controls.push({
    controlId: "Art.9(4)(c)",
    controlName: "ICT Risk Assessment",
    category: "Risk Management",
    status: art9cReqs.every((r) => !r.required || r.met)
      ? "PASS"
      : "FAIL",
    requirements: art9cReqs,
    recommendation: !art9cReqs.every((r) => !r.required || r.met)
      ? "Document risk assessment and change impact analysis for DORA compliance"
      : undefined,
  });

  // Art.10 - Incident Reporting
  const art10Reqs: RequirementCheck[] = [
    {
      name: "Audit trail maintained",
      required: true,
      met: true, // PR workflow provides this
      detail: "Full audit trail via PR history",
    },
    {
      name: "Change documentation sufficient for incident investigation",
      required: true,
      met: evidence.hasDescription,
      detail: evidence.hasDescription
        ? "Description available for incident reference"
        : "Insufficient documentation for incident investigation",
    },
  ];

  controls.push({
    controlId: "Art.10",
    controlName: "Incident Reporting",
    category: "Incident Management",
    status: art10Reqs.every((r) => !r.required || r.met) ? "PASS" : "WARNING",
    requirements: art10Reqs,
  });

  const passed = controls.filter((c) => c.status === "PASS").length;
  const total = controls.length;

  return {
    frameworkId: "dora",
    frameworkName: "DORA",
    frameworkIcon: "🇪🇺",
    overallStatus:
      passed === total ? "COMPLIANT" : passed > 0 ? "PARTIAL" : "NON_COMPLIANT",
    controlResults: controls,
    score: Math.round((passed / total) * 100),
  };
}

// ===== ISO 27001:2022 ENGINE =====
function evaluateISO27001(evidence: DEREvidence): ComplianceResult {
  const controls: ControlResult[] = [];

  // A.8.32 - Change Management
  const a832Reqs: RequirementCheck[] = [
    {
      name: "Change subject to change management procedures",
      required: true,
      met: true, // PR workflow provides this
      detail: "PR workflow provides change management process",
    },
    {
      name: "Change reviewed and approved",
      required: true,
      met: evidence.approvalCount > 0,
      detail:
        evidence.approvalCount > 0
          ? `${evidence.approvalCount} approval(s)`
          : "No approvals found",
    },
    {
      name: "Change documented",
      required: true,
      met: evidence.hasDescription,
      detail: evidence.hasDescription
        ? "Change documentation provided"
        : "No documentation for this change",
    },
  ];

  controls.push({
    controlId: "A.8.32",
    controlName: "Change Management",
    category: "Operations Security",
    status: a832Reqs.every((r) => !r.required || r.met) ? "PASS" : "FAIL",
    requirements: a832Reqs,
    recommendation: !a832Reqs.every((r) => !r.required || r.met)
      ? "Ensure all changes are documented and approved through the change management process"
      : undefined,
  });

  // A.8.25 - Secure Development Lifecycle
  const a825Reqs: RequirementCheck[] = [
    {
      name: "Code review performed as part of secure development",
      required: true,
      met: evidence.reviewCount > 0,
      detail:
        evidence.reviewCount > 0
          ? `${evidence.reviewCount} review(s) performed`
          : "No code review - required for secure development lifecycle",
    },
    {
      name: "Peer review conducted",
      required: true,
      met: evidence.reviewCount > 0 && !evidence.hasSelfApproval,
      detail:
        evidence.reviewCount > 0 && !evidence.hasSelfApproval
          ? "Independent peer review conducted"
          : "Peer review requirement not met",
    },
  ];

  controls.push({
    controlId: "A.8.25",
    controlName: "Secure Development Lifecycle",
    category: "Development Security",
    status: a825Reqs.every((r) => !r.required || r.met) ? "PASS" : "FAIL",
    requirements: a825Reqs,
    recommendation: !a825Reqs.every((r) => !r.required || r.met)
      ? "Implement code review by independent reviewers for secure development"
      : undefined,
  });

  // A.8.9 - Configuration Management
  const a89Reqs: RequirementCheck[] = [
    {
      name: "Configuration changes documented",
      required: true,
      met: evidence.hasDescription,
      detail: evidence.hasDescription
        ? "Change documented in PR description"
        : "No documentation for configuration change",
    },
    {
      name: "Change linked to requirement",
      required: false,
      met: evidence.ticketCount > 0,
      detail:
        evidence.ticketCount > 0
          ? "Linked to tracking ticket"
          : "Recommended: link to requirement ticket for traceability",
    },
    {
      name: "Change scope defined",
      required: true,
      met: evidence.filesChanged.length > 0,
      detail: `${evidence.filesChanged.length} files in change scope`,
    },
  ];

  const a89Status = a89Reqs.every((r) => !r.required || r.met)
    ? "PASS"
    : a89Reqs.filter((r) => r.required && !r.met).length === 0
    ? "WARNING"
    : "FAIL";

  controls.push({
    controlId: "A.8.9",
    controlName: "Configuration Management",
    category: "Configuration",
    status: a89Status,
    requirements: a89Reqs,
    recommendation:
      a89Status !== "PASS"
        ? "Document configuration changes and link to requirement tickets for full traceability"
        : undefined,
  });

  const passed = controls.filter((c) => c.status === "PASS").length;
  const total = controls.length;

  return {
    frameworkId: "iso27001",
    frameworkName: "ISO 27001:2022",
    frameworkIcon: "🌐",
    overallStatus:
      passed === total ? "COMPLIANT" : passed > 0 ? "PARTIAL" : "NON_COMPLIANT",
    controlResults: controls,
    score: Math.round((passed / total) * 100),
  };
}

/**
 * Main evaluation function - evaluates a DER against all enabled frameworks
 */
export function evaluateCompliance(
  evidence: DEREvidence,
  enabledFrameworks: string[]
): ComplianceResult[] {
  const results: ComplianceResult[] = [];

  if (enabledFrameworks.includes("soc2")) {
    results.push(evaluateSOC2(evidence));
  }
  if (enabledFrameworks.includes("dora")) {
    results.push(evaluateDORA(evidence));
  }
  if (enabledFrameworks.includes("iso27001")) {
    results.push(evaluateISO27001(evidence));
  }

  return results;
}

/**
 * Build DEREvidence from a DER record
 */
export function buildDEREvidence(der: {
  description: string | null;
  ticketLinks: string[];
  slackThreads: string[];
  prAuthor: string;
  filesChanged: string[] | null;
  aiDocQuality: string | null;
  aiAuditReadiness: string | null;
  reviews: Array<{ author: string; state: string }>;
  gaps: Array<{ resolved: boolean }>;
}): DEREvidence {
  const reviewers = der.reviews.map((r) => r.author);
  const approvals = der.reviews.filter((r) => r.state === "APPROVED");
  const hasSelfApproval = approvals.some((r) => r.author === der.prAuthor);

  return {
    hasDescription: !!der.description && der.description.trim().length > 0,
    descriptionLength: der.description?.length || 0,
    ticketCount: der.ticketLinks.length,
    reviewCount: der.reviews.length,
    approvalCount: approvals.length,
    hasRiskAssessment: !!der.aiDocQuality,
    aiDocQuality: der.aiDocQuality,
    aiAuditReadiness: der.aiAuditReadiness,
    filesChanged: der.filesChanged || [],
    hasSelfApproval,
    slackThreadCount: der.slackThreads.length,
    prAuthor: der.prAuthor,
    reviewers,
    gapCount: der.gaps.length,
    unresolvedGapCount: der.gaps.filter((g) => !g.resolved).length,
  };
}

/**
 * Get status color for UI rendering
 */
export function getStatusColor(
  status: "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT" | "PASS" | "FAIL" | "WARNING"
): { bg: string; text: string; border: string } {
  switch (status) {
    case "COMPLIANT":
    case "PASS":
      return {
        bg: "bg-[#4a7c59]/10",
        text: "text-[#4a7c59]",
        border: "border-[#4a7c59]/30",
      };
    case "PARTIAL":
    case "WARNING":
      return {
        bg: "bg-[#d4a853]/10",
        text: "text-[#d4a853]",
        border: "border-[#d4a853]/30",
      };
    case "NON_COMPLIANT":
    case "FAIL":
      return {
        bg: "bg-[#c45c5c]/10",
        text: "text-[#c45c5c]",
        border: "border-[#c45c5c]/30",
      };
  }
}
