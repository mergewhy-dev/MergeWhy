import { getInstallationOctokit } from "./github";

interface EvidenceGap {
  type: string;
  severity: string;
  message: string;
  suggestion: string | null;
  resolved: boolean;
}

interface CheckInput {
  installationId: number;
  owner: string;
  repo: string;
  headSha: string;
  prNumber: number;
  derId: string;
  evidenceScore: number;
  gaps: EvidenceGap[];
  prTitle: string;
  // AI Analysis fields (optional)
  aiDocQuality?: string | null;
  aiAuditReadiness?: string | null;
}

type CheckConclusion = "success" | "neutral" | "failure";

/**
 * Determine check conclusion based on evidence and AI analysis
 *
 * - "success": evidenceScore >= 60 AND no HIGH/CRITICAL gaps AND auditReadiness !== "NOT_READY"
 * - "neutral": evidenceScore >= 40 AND no CRITICAL gaps
 * - "failure": evidenceScore < 40 OR has CRITICAL gaps OR auditReadiness === "NOT_READY"
 */
function determineConclusion(
  evidenceScore: number,
  unresolvedGaps: EvidenceGap[],
  aiAuditReadiness?: string | null
): CheckConclusion {
  const hasCriticalGaps = unresolvedGaps.some((g) => g.severity === "CRITICAL");
  const hasHighOrCriticalGaps = unresolvedGaps.some(
    (g) => g.severity === "HIGH" || g.severity === "CRITICAL"
  );

  // Failure conditions
  if (evidenceScore < 40 || hasCriticalGaps || aiAuditReadiness === "NOT_READY") {
    return "failure";
  }

  // Success conditions - score >= 60, no high/critical gaps, audit not NOT_READY
  if (evidenceScore >= 60 && !hasHighOrCriticalGaps && aiAuditReadiness !== "NOT_READY") {
    return "success";
  }

  // Neutral for in-between states
  return "neutral";
}

/**
 * Create or update a GitHub Check Run for evidence status
 */
export async function updateEvidenceCheck(input: CheckInput): Promise<void> {
  const {
    installationId,
    owner,
    repo,
    headSha,
    prNumber,
    derId,
    evidenceScore,
    gaps,
    prTitle,
    aiDocQuality,
    aiAuditReadiness,
  } = input;

  try {
    const octokit = await getInstallationOctokit(installationId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const recordUrl = `${appUrl}/records/${derId}`;

    // Determine check status based on evidence
    const unresolvedGaps = gaps.filter((g) => !g.resolved);
    const highSeverityGaps = unresolvedGaps.filter(
      (g) => g.severity === "HIGH" || g.severity === "CRITICAL"
    );

    const conclusion = determineConclusion(evidenceScore, unresolvedGaps, aiAuditReadiness);

    // Build title based on conclusion
    let title: string;
    if (conclusion === "success") {
      title = `Documentation Complete - Score: ${evidenceScore}/100`;
    } else if (conclusion === "neutral") {
      title = `Review Recommended - Score: ${evidenceScore}/100`;
    } else {
      title = `Documentation Required - Score: ${evidenceScore}/100`;
    }

    // Build the check summary
    const summary = buildCheckSummary({
      evidenceScore,
      unresolvedGaps,
      highSeverityGaps,
      conclusion,
      derId,
      recordUrl,
      aiDocQuality,
      aiAuditReadiness,
    });

    // Build detailed text
    const text = buildCheckText({
      evidenceScore,
      unresolvedGaps,
      prTitle,
      recordUrl,
      aiDocQuality,
      aiAuditReadiness,
    });

    // Create the check run
    await octokit.checks.create({
      owner,
      repo,
      name: "MergeWhy Evidence",
      head_sha: headSha,
      status: "completed",
      conclusion,
      output: {
        title,
        summary,
        text,
      },
      details_url: recordUrl,
    });

    console.log(
      `[GitHub Check] Created check for PR #${prNumber}: ${conclusion.toUpperCase()} (score: ${evidenceScore}, docQuality: ${aiDocQuality || "N/A"}, auditReady: ${aiAuditReadiness || "N/A"})`
    );
  } catch (error) {
    console.error("[GitHub Check] Failed to create check:", error);
    // Don't throw - we don't want to fail the webhook if the check fails
  }
}

function buildCheckSummary(input: {
  evidenceScore: number;
  unresolvedGaps: EvidenceGap[];
  highSeverityGaps: EvidenceGap[];
  conclusion: CheckConclusion;
  derId: string;
  recordUrl: string;
  aiDocQuality?: string | null;
  aiAuditReadiness?: string | null;
}): string {
  const { evidenceScore, unresolvedGaps, highSeverityGaps, conclusion, recordUrl, aiDocQuality, aiAuditReadiness } = input;

  let summary = "";

  // Header based on status
  if (conclusion === "success") {
    summary += "## Documentation Complete\n\n";
    summary += `This PR has sufficient documentation for compliance. Score: **${evidenceScore}/100**\n\n`;
  } else if (conclusion === "neutral") {
    summary += "## Review Recommended\n\n";
    summary += `This PR has some documentation gaps. Score: **${evidenceScore}/100**\n\n`;
  } else {
    summary += "## Documentation Required\n\n";
    summary += `This PR needs more documentation before merging. Score: **${evidenceScore}/100**\n\n`;
  }

  // What's good (for passing checks)
  if (conclusion === "success") {
    summary += "### What's Good\n\n";
    if (evidenceScore >= 60) {
      summary += "- Evidence score meets requirements (60+)\n";
    }
    if (highSeverityGaps.length === 0) {
      summary += "- No critical documentation gaps\n";
    }
    if (aiDocQuality === "COMPLETE") {
      summary += "- Documentation is complete and clear\n";
    }
    if (aiAuditReadiness === "READY") {
      summary += "- Ready for audit review\n";
    }
    summary += "\n";
  }

  // What's missing (for failing/neutral checks)
  if (conclusion !== "success" && unresolvedGaps.length > 0) {
    summary += "### What's Missing\n\n";

    // Group gaps by type for cleaner display
    const gapsByType: Record<string, EvidenceGap[]> = {};
    unresolvedGaps.forEach(gap => {
      if (!gapsByType[gap.type]) {
        gapsByType[gap.type] = [];
      }
      gapsByType[gap.type].push(gap);
    });

    for (const [type, typeGaps] of Object.entries(gapsByType)) {
      const icon = typeGaps[0].severity === "CRITICAL" || typeGaps[0].severity === "HIGH" ? "!" : "-";
      const gap = typeGaps[0];

      switch (type) {
        case "MISSING_DESCRIPTION":
          summary += `- ${icon} **No PR description** - Add a description explaining what changed and why\n`;
          break;
        case "MISSING_TICKET":
          summary += `- ${icon} **No ticket linked** - Link a Jira, Linear, or GitHub issue\n`;
          break;
        case "MISSING_REVIEW":
          summary += `- ${icon} **No code review** - Request a review from team members\n`;
          break;
        case "MISSING_APPROVAL":
          summary += `- ${icon} **No approval** - Get approval from a reviewer\n`;
          break;
        case "INSUFFICIENT_CONTEXT":
          summary += `- ${icon} **Description too short** - Add more context about why this change is needed\n`;
          break;
        default:
          summary += `- ${icon} ${gap.message}\n`;
      }
    }
    summary += "\n";
  }

  // Failure reasons
  if (conclusion === "failure") {
    summary += "### Why This Check Failed\n\n";
    if (evidenceScore < 40) {
      summary += `- Evidence score (${evidenceScore}) is below minimum (40)\n`;
    }
    if (highSeverityGaps.length > 0) {
      summary += `- ${highSeverityGaps.length} critical documentation gap(s) need to be addressed\n`;
    }
    if (aiAuditReadiness === "NOT_READY") {
      summary += `- Documentation is not ready for audit\n`;
    }
    summary += "\n";
  }

  // Documentation status table
  summary += "### Documentation Status\n\n";
  summary += "| Check | Status |\n";
  summary += "|-------|--------|\n";
  summary += `| Evidence Score | ${evidenceScore >= 60 ? "Pass" : evidenceScore >= 40 ? "Partial" : "Fail"} ${evidenceScore}/100 |\n`;
  summary += `| Documentation Gaps | ${unresolvedGaps.length === 0 ? "None" : `${unresolvedGaps.length} gap(s)`} |\n`;

  if (aiDocQuality) {
    const qualityLabel = aiDocQuality === "COMPLETE" ? "Complete" : aiDocQuality === "PARTIAL" ? "Partial" : "Insufficient";
    summary += `| Documentation Quality | ${qualityLabel} |\n`;
  }

  if (aiAuditReadiness) {
    const readinessLabel = aiAuditReadiness === "READY" ? "Ready" : aiAuditReadiness === "NEEDS_WORK" ? "Needs Work" : "Not Ready";
    summary += `| Audit Readiness | ${readinessLabel} |\n`;
  }

  // Link to full report
  summary += "\n---\n\n";
  summary += `**[View Full Evidence Report](${recordUrl})**\n`;

  return summary;
}

function buildCheckText(input: {
  evidenceScore: number;
  unresolvedGaps: EvidenceGap[];
  prTitle: string;
  recordUrl: string;
  aiDocQuality?: string | null;
  aiAuditReadiness?: string | null;
}): string {
  const { unresolvedGaps, prTitle, recordUrl, aiDocQuality, aiAuditReadiness } = input;

  let text = `# ${prTitle}\n\n`;

  // Documentation Quality summary
  if (aiDocQuality || aiAuditReadiness) {
    text += "## Documentation Assessment\n\n";
    if (aiDocQuality) {
      const qualityDesc = {
        COMPLETE: "The PR description clearly explains what changed and why. Good context for auditors.",
        PARTIAL: "Some documentation is present but missing key details about the purpose or context.",
        INSUFFICIENT: "The PR lacks sufficient documentation. Auditors would have questions about this change.",
      }[aiDocQuality] || "";
      text += `**Documentation Quality**: ${aiDocQuality}\n`;
      if (qualityDesc) text += `> ${qualityDesc}\n`;
      text += "\n";
    }
    if (aiAuditReadiness) {
      const readinessDesc = {
        READY: "This change has sufficient documentation for compliance audit purposes.",
        NEEDS_WORK: "Some additional context or documentation would help auditors understand this change.",
        NOT_READY: "This change needs more documentation before it can be reviewed by auditors.",
      }[aiAuditReadiness] || "";
      text += `**Audit Readiness**: ${aiAuditReadiness}\n`;
      if (readinessDesc) text += `> ${readinessDesc}\n`;
      text += "\n";
    }
  }

  // Gaps to address
  if (unresolvedGaps.length > 0) {
    text += "## Documentation Gaps\n\n";

    unresolvedGaps.forEach((gap, index) => {
      const severityLabel =
        gap.severity === "CRITICAL" ? "Critical" :
        gap.severity === "HIGH" ? "High" :
        gap.severity === "MEDIUM" ? "Medium" : "Low";

      text += `### ${index + 1}. ${gap.message}\n\n`;
      text += `**Priority**: ${severityLabel}\n`;
      if (gap.suggestion) {
        text += `**How to fix**: ${gap.suggestion}\n`;
      }
      text += "\n";
    });
  } else {
    text += "## All Documentation Requirements Met\n\n";
    text += "This PR has sufficient documentation for compliance purposes.\n\n";
  }

  // How to improve
  text += "## How to Improve Your Score\n\n";
  text += "| Action | Points |\n";
  text += "|--------|--------|\n";
  text += "| Add detailed PR description explaining what and why | +25 |\n";
  text += "| Link a ticket (Jira, Linear, GitHub Issue) | +25 |\n";
  text += "| Get a code review | +15 |\n";
  text += "| Get an approval | +20 |\n";
  text += "| Add Slack context | +10 |\n";
  text += "\n";

  // Footer with link
  text += "---\n\n";
  text += `**[View Full Evidence Report](${recordUrl})** - See complete audit trail and compliance details.\n\n`;
  text += "_Powered by [MergeWhy](https://mergewhy.com) - Decision Evidence for SOC 2/SOX Compliance_\n";

  return text;
}

/**
 * Get the head SHA for a pull request
 */
export async function getPullRequestHeadSha(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> {
  const octokit = await getInstallationOctokit(installationId);

  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return pr.head.sha;
}
