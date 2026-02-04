import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { prisma } from "@mergewhy/database";
import { extractTicketLinks, extractSlackLinks } from "@/lib/evidence-extractor";
import { calculateEvidenceScore, detectGaps } from "@/lib/evidence-score";

// Webhook events are not protected by auth middleware
export const dynamic = "force-dynamic";

function getWebhooks() {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("GITHUB_WEBHOOK_SECRET is not configured");
  }
  return new Webhooks({ secret });
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const event = request.headers.get("x-github-event") ?? "";

  // Skip verification in development if no secret is set
  if (process.env.GITHUB_WEBHOOK_SECRET) {
    try {
      const webhooks = getWebhooks();
      const isValid = await webhooks.verify(payload, signature);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch (error) {
      console.error("Webhook verification error:", error);
      return NextResponse.json({ error: "Verification failed" }, { status: 401 });
    }
  }

  try {
    const data = JSON.parse(payload);

    console.log(`Received GitHub webhook: ${event}`, {
      action: data.action,
      repository: data.repository?.full_name,
    });

    // Handle different events
    switch (event) {
      case "pull_request":
        await handlePullRequest(data);
        break;
      case "pull_request_review":
        await handlePullRequestReview(data);
        break;
      case "pull_request_review_comment":
        await handlePullRequestReviewComment(data);
        break;
      case "installation":
        await handleInstallation(data);
        break;
      case "installation_repositories":
        await handleInstallationRepositories(data);
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

interface PullRequestWebhook {
  action: string;
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    user: {
      login: string;
      avatar_url: string;
    };
    base: {
      ref: string;
    };
    head: {
      ref: string;
    };
    merged: boolean;
    merged_at: string | null;
  };
  repository: {
    id: number;
    full_name: string;
  };
  installation?: {
    id: number;
  };
}

async function handlePullRequest(data: PullRequestWebhook) {
  const { action, pull_request, repository } = data;

  // Find repository in our database
  const repo = await prisma.repository.findFirst({
    where: { githubId: repository.id },
    include: { organization: { include: { settings: true } } },
  });

  if (!repo) {
    console.log(`Repository not found: ${repository.full_name}`);
    return;
  }

  if (!repo.isActive) {
    console.log(`Repository is not active: ${repository.full_name}`);
    return;
  }

  const ticketLinks = extractTicketLinks(pull_request.body || "");
  const slackThreads = extractSlackLinks(pull_request.body || "");

  const scoreInput = {
    hasDescription: !!pull_request.body && pull_request.body.length > 0,
    descriptionLength: pull_request.body?.length || 0,
    ticketCount: ticketLinks.length,
    reviewCount: 0,
    approvedReviewCount: 0,
    hasSlackContext: slackThreads.length > 0,
  };

  if (action === "opened" || action === "reopened") {
    // Check if DER already exists (in case of reopened)
    const existing = await prisma.decisionEvidenceRecord.findFirst({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
    });

    if (existing) {
      // Update existing DER
      await prisma.decisionEvidenceRecord.update({
        where: { id: existing.id },
        data: {
          prState: "OPEN",
          prTitle: pull_request.title,
          description: pull_request.body,
          ticketLinks,
          slackThreads,
          evidenceScore: calculateEvidenceScore(scoreInput),
          status: "PENDING",
        },
      });
    } else {
      // Create new DER
      const der = await prisma.decisionEvidenceRecord.create({
        data: {
          organizationId: repo.organizationId,
          repositoryId: repo.id,
          prNumber: pull_request.number,
          prTitle: pull_request.title,
          prUrl: pull_request.html_url,
          prAuthor: pull_request.user.login,
          prAuthorAvatar: pull_request.user.avatar_url,
          prState: "OPEN",
          prBaseBranch: pull_request.base.ref,
          prHeadBranch: pull_request.head.ref,
          description: pull_request.body,
          ticketLinks,
          slackThreads,
          evidenceScore: calculateEvidenceScore(scoreInput),
          status: "PENDING",
        },
      });

      // Create initial evidence item for PR description
      if (pull_request.body) {
        await prisma.evidenceItem.create({
          data: {
            derId: der.id,
            type: "PR_DESCRIPTION",
            sourceUrl: pull_request.html_url,
            content: pull_request.body,
          },
        });
      }

      // Detect and create gaps
      const settings = repo.organization.settings;
      if (settings) {
        const gaps = detectGaps(scoreInput, {
          requireDescription: settings.requireDescription,
          requireTicketLink: settings.requireTicketLink,
          minReviewers: settings.minReviewers,
        });

        for (const gap of gaps) {
          await prisma.evidenceGap.create({
            data: {
              derId: der.id,
              type: gap.type,
              severity: gap.severity,
              message: gap.message,
              suggestion: gap.suggestion,
            },
          });
        }
      }
    }

    console.log(`DER created/updated for PR #${pull_request.number}`);
  } else if (action === "edited") {
    // Update existing DER
    const der = await prisma.decisionEvidenceRecord.findFirst({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
    });

    if (der) {
      await prisma.decisionEvidenceRecord.update({
        where: { id: der.id },
        data: {
          prTitle: pull_request.title,
          description: pull_request.body,
          ticketLinks,
          slackThreads,
        },
      });

      // Update description evidence item
      await prisma.evidenceItem.updateMany({
        where: { derId: der.id, type: "PR_DESCRIPTION" },
        data: { content: pull_request.body },
      });
    }
  } else if (action === "closed") {
    const der = await prisma.decisionEvidenceRecord.findFirst({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
      include: { gaps: { where: { resolved: false } } },
    });

    if (der) {
      const hasUnresolvedGaps = der.gaps.length > 0;
      await prisma.decisionEvidenceRecord.update({
        where: { id: der.id },
        data: {
          prState: pull_request.merged ? "MERGED" : "CLOSED",
          prMergedAt: pull_request.merged_at
            ? new Date(pull_request.merged_at)
            : null,
          status: hasUnresolvedGaps ? "INCOMPLETE" : "COMPLETE",
        },
      });
    }
  } else if (action === "synchronize") {
    // PR was updated with new commits - recalculate score
    const der = await prisma.decisionEvidenceRecord.findFirst({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
    });

    if (der) {
      await recalculateScore(der.id);
    }
  }
}

interface ReviewWebhook {
  action: string;
  review: {
    id: number;
    user: {
      login: string;
    };
    state: string;
    body: string | null;
    submitted_at: string;
  };
  pull_request: {
    number: number;
  };
  repository: {
    id: number;
  };
}

async function handlePullRequestReview(data: ReviewWebhook) {
  const { action, review, pull_request, repository } = data;

  if (action !== "submitted") return;

  const repo = await prisma.repository.findFirst({
    where: { githubId: repository.id },
  });

  if (!repo) return;

  const der = await prisma.decisionEvidenceRecord.findFirst({
    where: { repositoryId: repo.id, prNumber: pull_request.number },
  });

  if (!der) return;

  // Upsert the review
  await prisma.pRReview.upsert({
    where: { derId_githubId: { derId: der.id, githubId: review.id } },
    create: {
      derId: der.id,
      githubId: review.id,
      author: review.user.login,
      state: review.state.toUpperCase() as
        | "PENDING"
        | "APPROVED"
        | "CHANGES_REQUESTED"
        | "COMMENTED"
        | "DISMISSED",
      body: review.body,
      submittedAt: new Date(review.submitted_at),
    },
    update: {
      state: review.state.toUpperCase() as
        | "PENDING"
        | "APPROVED"
        | "CHANGES_REQUESTED"
        | "COMMENTED"
        | "DISMISSED",
      body: review.body,
    },
  });

  // Recalculate evidence score
  await recalculateScore(der.id);

  console.log(`Review recorded for PR #${pull_request.number}`);
}

interface ReviewCommentWebhook {
  action: string;
  comment: {
    id: number;
    user: {
      login: string;
    };
    body: string;
    path: string | null;
    created_at: string;
  };
  pull_request: {
    number: number;
  };
  repository: {
    id: number;
  };
}

async function handlePullRequestReviewComment(data: ReviewCommentWebhook) {
  const { action, comment, pull_request, repository } = data;

  if (action !== "created") return;

  const repo = await prisma.repository.findFirst({
    where: { githubId: repository.id },
  });

  if (!repo) return;

  const der = await prisma.decisionEvidenceRecord.findFirst({
    where: { repositoryId: repo.id, prNumber: pull_request.number },
  });

  if (!der) return;

  // Store the comment
  await prisma.pRComment.upsert({
    where: { derId_githubId: { derId: der.id, githubId: comment.id } },
    create: {
      derId: der.id,
      githubId: comment.id,
      author: comment.user.login,
      body: comment.body,
      path: comment.path,
    },
    update: {
      body: comment.body,
    },
  });

  console.log(`Comment recorded for PR #${pull_request.number}`);
}

interface InstallationWebhook {
  action: string;
  installation: {
    id: number;
    account: {
      login: string;
      type: string;
    };
  };
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
  }>;
}

async function handleInstallation(data: InstallationWebhook) {
  const { action, installation, repositories } = data;

  console.log(`Installation ${action}: ${installation.id}`, {
    account: installation.account.login,
    repoCount: repositories?.length,
  });

  // For now, just log the installation
  // In production, you would:
  // 1. Store the installation ID
  // 2. Link it to an organization
  // 3. Create repository records
}

async function handleInstallationRepositories(data: InstallationWebhook) {
  const { action, installation, repositories } = data;

  console.log(`Installation repositories ${action}:`, {
    installationId: installation.id,
    repositories: repositories?.map((r) => r.full_name),
  });
}

async function recalculateScore(derId: string) {
  const der = await prisma.decisionEvidenceRecord.findUnique({
    where: { id: derId },
    include: {
      reviews: true,
      organization: { include: { settings: true } },
      gaps: true,
    },
  });

  if (!der) return;

  const approvedCount = der.reviews.filter((r) => r.state === "APPROVED").length;

  const scoreInput = {
    hasDescription: !!der.description && der.description.length > 0,
    descriptionLength: der.description?.length || 0,
    ticketCount: der.ticketLinks.length,
    reviewCount: der.reviews.length,
    approvedReviewCount: approvedCount,
    hasSlackContext: der.slackThreads.length > 0,
  };

  const newScore = calculateEvidenceScore(scoreInput);

  // Determine new status based on score and gaps
  let newStatus = der.status;
  if (der.prState === "OPEN") {
    if (newScore >= 75 && der.gaps.filter((g) => !g.resolved).length === 0) {
      newStatus = "CONFIRMED";
    } else if (newScore < 50 || der.gaps.filter((g) => !g.resolved).length > 0) {
      newStatus = "NEEDS_REVIEW";
    }
  }

  // Update gaps based on current state
  const settings = der.organization.settings;
  if (settings) {
    // Resolve approval gaps if we have enough approvals
    if (approvedCount >= settings.minReviewers) {
      await prisma.evidenceGap.updateMany({
        where: { derId, type: "MISSING_APPROVAL", resolved: false },
        data: { resolved: true, resolvedAt: new Date() },
      });
    }

    // Resolve review gaps if we have reviews
    if (der.reviews.length > 0) {
      await prisma.evidenceGap.updateMany({
        where: { derId, type: "MISSING_REVIEW", resolved: false },
        data: { resolved: true, resolvedAt: new Date() },
      });
    }

    // Resolve ticket gaps if we have tickets
    if (der.ticketLinks.length > 0) {
      await prisma.evidenceGap.updateMany({
        where: { derId, type: "MISSING_TICKET", resolved: false },
        data: { resolved: true, resolvedAt: new Date() },
      });
    }

    // Resolve description gaps if we have description
    if (der.description && der.description.length > 0) {
      await prisma.evidenceGap.updateMany({
        where: { derId, type: "MISSING_DESCRIPTION", resolved: false },
        data: { resolved: true, resolvedAt: new Date() },
      });
    }
  }

  await prisma.decisionEvidenceRecord.update({
    where: { id: derId },
    data: {
      evidenceScore: newScore,
      status: newStatus,
    },
  });
}
