import { prisma } from "@mergewhy/database";
import { calculateEvidenceScore, detectGaps, type ScoreInput, type DetectedGap } from "./evidence-score";
import { extractTicketLinks, extractSlackLinks } from "./evidence-extractor";

interface RecalculateResult {
  evidenceScore: number;
  gaps: DetectedGap[];
  scoreInput: ScoreInput;
}

/**
 * Recalculate gaps and evidence score for a DER
 * This is the single source of truth for gap detection and scoring
 */
export async function recalculateGapsAndScore(derId: string): Promise<RecalculateResult | null> {
  console.log(`\n========================================`);
  console.log(`[recalculateGapsAndScore] CALLED for DER: ${derId}`);
  console.log(`========================================`);

  // Fetch the DER with all related data
  const der = await prisma.decisionEvidenceRecord.findUnique({
    where: { id: derId },
    include: {
      reviews: true,
      organization: { include: { settings: true } },
    },
  });

  if (!der) {
    console.log(`[recalculateGapsAndScore] DER not found: ${derId}`);
    return null;
  }

  console.log(`[recalculateGapsAndScore] Fetched DER from DB:`, {
    id: der.id,
    prTitle: der.prTitle,
    currentScore: der.evidenceScore,
    descriptionLength: der.description?.length || 0,
    ticketLinksCount: der.ticketLinks.length,
    slackThreadsCount: der.slackThreads.length,
    reviewsCount: der.reviews.length,
  });

  // Extract evidence from current data
  // Re-extract tickets and slack from description in case they weren't saved properly
  const ticketLinksFromDesc = extractTicketLinks(der.description || "");
  const slackThreadsFromDesc = extractSlackLinks(der.description || "");

  // Use the maximum of stored vs extracted
  const ticketCount = Math.max(der.ticketLinks.length, ticketLinksFromDesc.length);
  const hasSlack = der.slackThreads.length > 0 || slackThreadsFromDesc.length > 0;

  // Build score input
  const hasDescription = !!der.description && der.description.trim().length > 0;
  const descriptionLength = der.description?.trim().length || 0;
  const reviewCount = der.reviews.length;
  const approvedReviewCount = der.reviews.filter((r) => r.state === "APPROVED").length;

  const scoreInput: ScoreInput = {
    hasDescription,
    descriptionLength,
    ticketCount,
    reviewCount,
    approvedReviewCount,
    hasSlackContext: hasSlack,
  };

  console.log(`[recalculateGapsAndScore] Score input calculated:`, {
    hasDescription,
    descriptionLength,
    ticketCount,
    reviewCount,
    approvedReviewCount,
    hasSlack,
  });

  // Calculate new score
  const evidenceScore = calculateEvidenceScore(scoreInput);

  console.log(`[recalculateGapsAndScore] CALCULATED SCORE: ${evidenceScore}`);

  // Get gap settings
  const settings = der.organization.settings;
  const gapSettings = {
    requireDescription: settings?.requireDescription ?? true,
    requireTicketLink: settings?.requireTicketLink ?? true,
    minReviewers: settings?.minReviewers ?? 1,
  };

  // Detect new gaps based on current data
  const newGaps = detectGaps(scoreInput, gapSettings);

  console.log(`[recalculateGapsAndScore] DER ${derId} detected gaps:`, newGaps.map(g => g.type));

  // Delete all existing gaps for this DER
  const deleteResult = await prisma.evidenceGap.deleteMany({
    where: { derId },
  });
  console.log(`[recalculateGapsAndScore] Deleted ${deleteResult.count} existing gaps`);

  // Create new gaps
  for (const gap of newGaps) {
    await prisma.evidenceGap.create({
      data: {
        derId,
        type: gap.type,
        severity: gap.severity,
        message: gap.message,
        suggestion: gap.suggestion,
        resolved: false,
      },
    });
  }
  console.log(`[recalculateGapsAndScore] Created ${newGaps.length} new gaps`);

  // Update tickets if we extracted more from description
  const ticketsToStore = ticketLinksFromDesc.length > der.ticketLinks.length
    ? ticketLinksFromDesc
    : der.ticketLinks;

  const slackToStore = slackThreadsFromDesc.length > der.slackThreads.length
    ? slackThreadsFromDesc
    : der.slackThreads;

  // Determine status based on score and gaps
  let newStatus = der.status;
  if (der.prState === "OPEN") {
    const hasHighSeverityGaps = newGaps.some(g => g.severity === "HIGH" || g.severity === "CRITICAL");
    if (evidenceScore >= 75 && newGaps.length === 0) {
      newStatus = "CONFIRMED";
    } else if (evidenceScore < 50 || hasHighSeverityGaps) {
      newStatus = "NEEDS_REVIEW";
    } else {
      newStatus = "PENDING";
    }
  }

  // Update the DER with new score and status
  console.log(`[recalculateGapsAndScore] Updating DER in database with:`, {
    evidenceScore,
    status: newStatus,
    ticketLinks: ticketsToStore,
    slackThreads: slackToStore,
  });

  const updatedDer = await prisma.decisionEvidenceRecord.update({
    where: { id: derId },
    data: {
      evidenceScore,
      status: newStatus,
      ticketLinks: ticketsToStore,
      slackThreads: slackToStore,
    },
  });

  console.log(`[recalculateGapsAndScore] DATABASE UPDATE COMPLETE:`, {
    id: updatedDer.id,
    newScore: updatedDer.evidenceScore,
    newStatus: updatedDer.status,
  });
  console.log(`========================================\n`);

  return {
    evidenceScore,
    gaps: newGaps,
    scoreInput,
  };
}

/**
 * Get the gaps for a DER formatted for GitHub Check
 */
export async function getGapsForCheck(derId: string): Promise<Array<{
  type: string;
  severity: string;
  message: string;
  suggestion: string | null;
  resolved: boolean;
}>> {
  const gaps = await prisma.evidenceGap.findMany({
    where: { derId },
  });

  return gaps.map((g) => ({
    type: g.type,
    severity: g.severity,
    message: g.message,
    suggestion: g.suggestion,
    resolved: g.resolved,
  }));
}
