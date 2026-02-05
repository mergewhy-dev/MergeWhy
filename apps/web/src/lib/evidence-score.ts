export interface ScoreInput {
  hasDescription: boolean;
  descriptionLength: number;
  ticketCount: number;
  reviewCount: number;
  approvedReviewCount: number;
  hasSlackContext: boolean;
  commentCount?: number;
}

export interface ScoreBreakdown {
  description: number;
  tickets: number;
  reviews: number;
  slackContext: number;
  completeness: number;
  total: number;
}

export function calculateEvidenceScore(input: ScoreInput): number {
  const breakdown = calculateScoreBreakdown(input);
  return breakdown.total;
}

export function calculateScoreBreakdown(input: ScoreInput): ScoreBreakdown {
  let description = 0;
  let tickets = 0;
  let reviews = 0;
  let slackContext = 0;
  let completeness = 0;

  // Description (0-25 points)
  // - Description exists (>10 chars): +15 points
  // - Description detailed (>100 chars): +10 points
  if (input.hasDescription && input.descriptionLength > 10) {
    description += 15;
    if (input.descriptionLength > 100) {
      description += 10;
    }
  }

  // Ticket links: +25 points
  if (input.ticketCount > 0) {
    tickets = 25;
  }

  // Reviews (0-35 points)
  // - Has review: +15 points
  // - Has approval: +20 points
  if (input.reviewCount > 0) {
    reviews += 15;
  }
  if (input.approvedReviewCount > 0) {
    reviews += 20;
  }

  // Slack context: +10 points
  if (input.hasSlackContext) {
    slackContext = 10;
  }

  // Completeness bonus removed - points are now more direct

  const total = Math.min(
    description + tickets + reviews + slackContext + completeness,
    100
  );

  console.log("[Evidence Score] Calculation:", {
    input: {
      hasDescription: input.hasDescription,
      descriptionLength: input.descriptionLength,
      ticketCount: input.ticketCount,
      reviewCount: input.reviewCount,
      approvedReviewCount: input.approvedReviewCount,
      hasSlackContext: input.hasSlackContext,
    },
    breakdown: { description, tickets, reviews, slackContext, completeness },
    total,
  });

  return {
    description,
    tickets,
    reviews,
    slackContext,
    completeness,
    total,
  };
}

export interface GapDetectionSettings {
  requireDescription: boolean;
  requireTicketLink: boolean;
  minReviewers: number;
}

export interface DetectedGap {
  type:
    | "MISSING_DESCRIPTION"
    | "MISSING_TICKET"
    | "MISSING_REVIEW"
    | "INSUFFICIENT_CONTEXT"
    | "NO_TESTING_EVIDENCE"
    | "MISSING_APPROVAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  suggestion: string;
}

export function detectGaps(
  input: ScoreInput,
  settings: GapDetectionSettings
): DetectedGap[] {
  const gaps: DetectedGap[] = [];

  // Check for missing description
  if (settings.requireDescription && !input.hasDescription) {
    gaps.push({
      type: "MISSING_DESCRIPTION",
      severity: "HIGH",
      message: "PR description is empty",
      suggestion: "Add a description explaining what this change does and why",
    });
  } else if (input.hasDescription && input.descriptionLength < 50) {
    gaps.push({
      type: "INSUFFICIENT_CONTEXT",
      severity: "LOW",
      message: "PR description is very short",
      suggestion:
        "Consider adding more context about the changes and their purpose",
    });
  }

  // Check for missing ticket
  if (settings.requireTicketLink && input.ticketCount === 0) {
    gaps.push({
      type: "MISSING_TICKET",
      severity: "MEDIUM",
      message: "No ticket or issue linked",
      suggestion: "Link a Jira ticket, Linear issue, or GitHub issue",
    });
  }

  // Check for missing reviews
  if (input.reviewCount === 0) {
    gaps.push({
      type: "MISSING_REVIEW",
      severity: "MEDIUM",
      message: "No code reviews yet",
      suggestion: "Request review from team members",
    });
  }

  // Check for missing approvals
  if (input.approvedReviewCount < settings.minReviewers) {
    const needed = settings.minReviewers - input.approvedReviewCount;
    gaps.push({
      type: "MISSING_APPROVAL",
      severity: needed >= 2 ? "HIGH" : "MEDIUM",
      message: `Needs ${needed} more approval${needed !== 1 ? "s" : ""}`,
      suggestion: "Request review from team members with approval rights",
    });
  }

  return gaps;
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 25) return "Poor";
  return "Incomplete";
}

export function getScoreColor(
  score: number
): "green" | "yellow" | "orange" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "yellow";
  if (score >= 25) return "orange";
  return "red";
}
