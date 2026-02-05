import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { prisma } from "@mergewhy/database";
import { extractTicketLinks, extractSlackLinks } from "@/lib/evidence-extractor";
import { updateEvidenceCheck } from "@/lib/github-checks";
import { analyzeChangeRisk } from "@/lib/ai-analysis";
import { getInstallationOctokit } from "@/lib/github";
import { recalculateGapsAndScore, getGapsForCheck } from "@/lib/der-recalculate";
import { createEvidenceVault } from "@/lib/evidence-vault";

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
      sha: string;
    };
    merged: boolean;
    merged_at: string | null;
    merged_by?: {
      login: string;
    } | null;
  };
  repository: {
    id: number;
    full_name: string;
    owner: {
      login: string;
    };
    name: string;
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
    include: {
      organization: { include: { settings: true } },
      gitHubInstallation: true,
    },
  });

  if (!repo) {
    console.log(`Repository not found: ${repository.full_name}`);
    return;
  }

  if (!repo.isActive) {
    console.log(`Repository is not active: ${repository.full_name}`);
    return;
  }

  // Extract evidence from PR body
  const ticketLinks = extractTicketLinks(pull_request.body || "");
  const slackThreads = extractSlackLinks(pull_request.body || "");

  console.log(`[GitHub Webhook] PR #${pull_request.number} evidence extraction:`, {
    hasBody: !!pull_request.body,
    bodyLength: pull_request.body?.length || 0,
    bodyPreview: pull_request.body?.substring(0, 100),
    ticketLinks,
    slackThreads,
  });

  if (action === "opened" || action === "reopened") {
    // Check if DER already exists (in case of reopened)
    const existing = await prisma.decisionEvidenceRecord.findFirst({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
    });

    let derId: string;

    if (existing) {
      // Update existing DER with new PR data
      await prisma.decisionEvidenceRecord.update({
        where: { id: existing.id },
        data: {
          prState: "OPEN",
          prTitle: pull_request.title,
          description: pull_request.body,
          ticketLinks,
          slackThreads,
          status: "PENDING",
        },
      });
      derId = existing.id;
      console.log(`[GitHub Webhook] Updated existing DER for PR #${pull_request.number}: ${derId}`);
    } else {
      // Create new DER with initial data (score will be calculated by recalculateGapsAndScore)
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
          evidenceScore: 0,
          status: "PENDING",
        },
      });
      derId = der.id;
      console.log(`[GitHub Webhook] Created new DER for PR #${pull_request.number}: ${derId}`);

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
    }

    // Recalculate gaps and score using the centralized function
    const result = await recalculateGapsAndScore(derId);

    // Get gaps for GitHub Check
    const gaps = await getGapsForCheck(derId);

    // Create GitHub Check Run
    if (repo.gitHubInstallation && data.installation?.id && result) {
      await updateEvidenceCheck({
        installationId: data.installation.id,
        owner: repository.owner.login,
        repo: repository.name,
        headSha: pull_request.head.sha,
        prNumber: pull_request.number,
        derId,
        evidenceScore: result.evidenceScore,
        gaps,
        prTitle: pull_request.title,
      });
    }

    // Run AI analysis in background (don't block webhook response)
    runAIAnalysis(derId, data.installation?.id, repository.owner.login, repository.name, pull_request.number, pull_request.head.sha).catch(err => {
      console.error("[AI Analysis] Background analysis failed:", err);
    });

    console.log(`[GitHub Webhook] DER created/updated for PR #${pull_request.number}, score: ${result?.evidenceScore}, gaps: ${gaps.length}`);
  } else if (action === "edited") {
    // Find existing DER
    const der = await prisma.decisionEvidenceRecord.findFirst({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
    });

    if (der) {
      console.log(`[GitHub Webhook] PR #${pull_request.number} edited`, {
        oldTicketLinks: der.ticketLinks,
        newTicketLinks: ticketLinks,
        oldDescription: der.description?.substring(0, 50),
        newDescription: pull_request.body?.substring(0, 50),
      });

      // Update DER with new PR data first
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
      if (pull_request.body) {
        const existingEvidence = await prisma.evidenceItem.findFirst({
          where: { derId: der.id, type: "PR_DESCRIPTION" },
        });
        if (existingEvidence) {
          await prisma.evidenceItem.update({
            where: { id: existingEvidence.id },
            data: { content: pull_request.body },
          });
        } else {
          await prisma.evidenceItem.create({
            data: {
              derId: der.id,
              type: "PR_DESCRIPTION",
              sourceUrl: pull_request.html_url,
              content: pull_request.body,
            },
          });
        }
      }

      // Use centralized function to recalculate gaps and score
      const result = await recalculateGapsAndScore(der.id);

      // Get gaps for GitHub Check
      const gaps = await getGapsForCheck(der.id);

      // Update GitHub Check
      if (repo.gitHubInstallation && data.installation?.id && result) {
        await updateEvidenceCheck({
          installationId: data.installation.id,
          owner: repository.owner.login,
          repo: repository.name,
          headSha: pull_request.head.sha,
          prNumber: pull_request.number,
          derId: der.id,
          evidenceScore: result.evidenceScore,
          gaps,
          prTitle: pull_request.title,
        });
      }

      // Re-run AI analysis with updated description
      runAIAnalysis(der.id, data.installation?.id, repository.owner.login, repository.name, pull_request.number, pull_request.head.sha).catch(err => {
        console.error("[AI Analysis] Background analysis failed:", err);
      });

      console.log(`[GitHub Webhook] PR #${pull_request.number} edited: score=${result?.evidenceScore}, gaps=${gaps.filter(g => !g.resolved).length} unresolved`);
    }
  } else if (action === "closed") {
    const der = await prisma.decisionEvidenceRecord.findFirst({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
      include: { gaps: { where: { resolved: false } } },
    });

    if (der) {
      const hasUnresolvedGaps = der.gaps.length > 0;

      // Update DER state
      await prisma.decisionEvidenceRecord.update({
        where: { id: der.id },
        data: {
          prState: pull_request.merged ? "MERGED" : "CLOSED",
          prMergedAt: pull_request.merged_at
            ? new Date(pull_request.merged_at)
            : null,
          status: pull_request.merged
            ? "COMPLETE" // Will be set by vault creation
            : hasUnresolvedGaps
            ? "INCOMPLETE"
            : "COMPLETE",
        },
      });

      // If PR was merged, create the Evidence Vault
      if (pull_request.merged) {
        const mergedBy = pull_request.merged_by?.login || pull_request.user.login;

        try {
          const vaultId = await createEvidenceVault(der.id, mergedBy);
          console.log(`[GitHub Webhook] Evidence vault created for merged PR #${pull_request.number}: ${vaultId}`);
        } catch (vaultError) {
          console.error(`[GitHub Webhook] Failed to create evidence vault for PR #${pull_request.number}:`, vaultError);
          // Don't throw - the webhook should still succeed
        }
      }
    }
  } else if (action === "synchronize") {
    // PR was updated with new commits - recalculate gaps and score
    const der = await prisma.decisionEvidenceRecord.findFirst({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
    });

    if (der) {
      // Use centralized function to recalculate gaps and score
      const result = await recalculateGapsAndScore(der.id);

      // Get gaps for GitHub Check
      const gaps = await getGapsForCheck(der.id);

      // Update GitHub Check
      if (repo.gitHubInstallation && data.installation?.id && result) {
        await updateEvidenceCheck({
          installationId: data.installation.id,
          owner: repository.owner.login,
          repo: repository.name,
          headSha: pull_request.head.sha,
          prNumber: pull_request.number,
          derId: der.id,
          evidenceScore: result.evidenceScore,
          gaps,
          prTitle: pull_request.title,
        });
      }

      // Re-run AI analysis with new commits
      runAIAnalysis(der.id, data.installation?.id, repository.owner.login, repository.name, pull_request.number, pull_request.head.sha).catch(err => {
        console.error("[AI Analysis] Background analysis failed:", err);
      });

      console.log(`[GitHub Webhook] PR #${pull_request.number} synchronized: score=${result?.evidenceScore}, gaps=${gaps.filter(g => !g.resolved).length} unresolved`);
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
    title: string;
    head: {
      sha: string;
    };
  };
  repository: {
    id: number;
    owner: {
      login: string;
    };
    name: string;
  };
  installation?: {
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

  // Use centralized function to recalculate gaps and score
  const result = await recalculateGapsAndScore(der.id);

  // Get gaps for GitHub Check
  const gaps = await getGapsForCheck(der.id);

  // Update GitHub Check if we have installation
  const repoWithInstallation = await prisma.repository.findFirst({
    where: { githubId: repository.id },
    include: { gitHubInstallation: true },
  });

  if (repoWithInstallation?.gitHubInstallation && data.installation?.id && result) {
    await updateEvidenceCheck({
      installationId: data.installation.id,
      owner: repository.owner.login,
      repo: repository.name,
      headSha: pull_request.head.sha,
      prNumber: pull_request.number,
      derId: der.id,
      evidenceScore: result.evidenceScore,
      gaps,
      prTitle: pull_request.title,
    });
  }

  console.log(`[GitHub Webhook] Review recorded for PR #${pull_request.number}: score=${result?.evidenceScore}, gaps=${gaps.filter(g => !g.resolved).length} unresolved`);
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
    default_branch?: string;
  }>;
}

async function handleInstallation(data: InstallationWebhook) {
  const { action, installation, repositories } = data;

  console.log(`[GitHub Webhook] Installation ${action}: ${installation.id}`, {
    account: installation.account.login,
    accountType: installation.account.type,
    repoCount: repositories?.length,
  });

  if (action === "created") {
    // Find an organization to link this installation to
    // For now, find the first organization or create one based on GitHub account
    let organization = await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!organization) {
      // Create a new organization based on the GitHub account
      const slug = installation.account.login.toLowerCase().replace(/[^a-z0-9]/g, "-");
      console.log(`[GitHub Webhook] No organization found, creating one: ${slug}`);

      organization = await prisma.organization.create({
        data: {
          name: installation.account.login,
          slug,
        },
      });

      // Create default settings
      await prisma.organizationSettings.create({
        data: {
          organizationId: organization.id,
          requireDescription: true,
          requireTicketLink: true,
          minReviewers: 1,
          blockMergeOnGaps: false,
        },
      });
    }

    console.log(`[GitHub Webhook] Linking installation to organization: ${organization.name} (${organization.id})`);

    // Create or update the GitHub installation record
    const gitHubInstallation = await prisma.gitHubInstallation.upsert({
      where: { installationId: installation.id },
      create: {
        installationId: installation.id,
        organizationId: organization.id,
        accountLogin: installation.account.login,
        accountType: installation.account.type,
      },
      update: {
        organizationId: organization.id,
        accountLogin: installation.account.login,
        accountType: installation.account.type,
      },
    });

    console.log(`[GitHub Webhook] GitHubInstallation saved: ${gitHubInstallation.id}`);

    // Create repository records for each repo
    if (repositories && repositories.length > 0) {
      for (const repo of repositories) {
        const repository = await prisma.repository.upsert({
          where: { githubId: repo.id },
          create: {
            githubId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            organizationId: organization.id,
            gitHubInstallationId: gitHubInstallation.id,
            isActive: true,
            defaultBranch: repo.default_branch || "main",
          },
          update: {
            name: repo.name,
            fullName: repo.full_name,
            gitHubInstallationId: gitHubInstallation.id,
            defaultBranch: repo.default_branch || "main",
          },
        });

        console.log(`[GitHub Webhook] Repository saved: ${repo.full_name} (${repository.id})`);
      }
    }

    console.log(`[GitHub Webhook] Installation complete: ${repositories?.length || 0} repositories saved`);
  } else if (action === "deleted") {
    // Mark installation as inactive or delete it
    console.log(`[GitHub Webhook] Installation deleted: ${installation.id}`);

    // Optionally deactivate repositories
    const gitHubInstallation = await prisma.gitHubInstallation.findUnique({
      where: { installationId: installation.id },
    });

    if (gitHubInstallation) {
      await prisma.repository.updateMany({
        where: { gitHubInstallationId: gitHubInstallation.id },
        data: { isActive: false },
      });
      console.log(`[GitHub Webhook] Repositories deactivated for installation: ${installation.id}`);
    }
  }
}

async function handleInstallationRepositories(data: InstallationWebhook) {
  const { action, installation, repositories } = data;

  console.log(`[GitHub Webhook] Installation repositories ${action}:`, {
    installationId: installation.id,
    repositories: repositories?.map((r) => r.full_name),
  });

  // Find the installation
  const gitHubInstallation = await prisma.gitHubInstallation.findUnique({
    where: { installationId: installation.id },
  });

  if (!gitHubInstallation) {
    console.error(`[GitHub Webhook] Installation not found: ${installation.id}`);
    return;
  }

  if (action === "added" && repositories) {
    // Add new repositories
    for (const repo of repositories) {
      const repository = await prisma.repository.upsert({
        where: { githubId: repo.id },
        create: {
          githubId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          organizationId: gitHubInstallation.organizationId,
          gitHubInstallationId: gitHubInstallation.id,
          isActive: true,
          defaultBranch: repo.default_branch || "main",
        },
        update: {
          name: repo.name,
          fullName: repo.full_name,
          isActive: true,
          defaultBranch: repo.default_branch || "main",
        },
      });

      console.log(`[GitHub Webhook] Repository added: ${repo.full_name} (${repository.id})`);
    }
  } else if (action === "removed" && repositories) {
    // Deactivate removed repositories
    for (const repo of repositories) {
      await prisma.repository.updateMany({
        where: { githubId: repo.id },
        data: { isActive: false },
      });

      console.log(`[GitHub Webhook] Repository deactivated: ${repo.full_name}`);
    }
  }
}


/**
 * Run AI analysis on a DER and update the database
 * This runs asynchronously to not block the webhook response
 */
async function runAIAnalysis(
  derId: string,
  installationId: number | undefined,
  owner: string,
  repoName: string,
  prNumber: number,
  headSha?: string
): Promise<void> {
  try {
    // Get the DER with description
    const der = await prisma.decisionEvidenceRecord.findUnique({
      where: { id: derId },
    });

    if (!der) {
      console.log(`[AI Analysis] DER not found: ${derId}`);
      return;
    }

    // Try to get the list of changed files and full diff from GitHub
    let filesChanged: string[] = [];
    let diff: string | null = null;

    if (installationId) {
      try {
        const octokit = await getInstallationOctokit(installationId);

        // Get list of files changed with their patches
        const { data: files } = await octokit.pulls.listFiles({
          owner,
          repo: repoName,
          pull_number: prNumber,
          per_page: 100,
        });

        filesChanged = files.map(f => f.filename);

        // Build diff from file patches (more reliable than raw diff endpoint)
        const diffParts: string[] = [];
        let totalDiffLength = 0;
        const maxDiffLength = 10000; // Limit total diff size

        for (const file of files) {
          if (file.patch && totalDiffLength < maxDiffLength) {
            const fileDiff = `diff --git a/${file.filename} b/${file.filename}
--- a/${file.filename}
+++ b/${file.filename}
${file.patch}`;
            diffParts.push(fileDiff);
            totalDiffLength += fileDiff.length;
          }
        }

        diff = diffParts.join("\n\n");

        // If we have files but no patches, try to get the raw diff
        if (filesChanged.length > 0 && !diff) {
          try {
            const { data: rawDiff } = await octokit.pulls.get({
              owner,
              repo: repoName,
              pull_number: prNumber,
              mediaType: { format: "diff" },
            });
            // rawDiff is a string when using diff format
            diff = (rawDiff as unknown as string).substring(0, maxDiffLength);
          } catch {
            console.log("[AI Analysis] Could not fetch raw diff");
          }
        }

        console.log(`[AI Analysis] Fetched ${filesChanged.length} files, diff length: ${diff?.length || 0}`);
      } catch (error) {
        console.error("[AI Analysis] Failed to fetch files from GitHub:", error);
      }
    }

    console.log(`[AI Analysis] Analyzing PR #${prNumber} with ${filesChanged.length} files`);

    // Run the AI analysis
    const analysis = await analyzeChangeRisk(
      der.prTitle,
      der.description,
      filesChanged,
      diff
    );

    // Update the DER with AI analysis and files changed
    const updatedDer = await prisma.decisionEvidenceRecord.update({
      where: { id: derId },
      data: {
        aiDocQuality: analysis.documentationQuality,
        aiIntentAlignment: analysis.intentAlignment,
        aiAuditReadiness: analysis.auditReadiness,
        aiMissingContext: analysis.missingContext || [],
        aiSuggestions: analysis.suggestions || [],
        aiSummary: analysis.summary,
        filesChanged,
        aiAnalyzedAt: new Date(),
      },
    });

    console.log(`[AI Analysis] Updated DER ${derId}: docQuality=${analysis.documentationQuality}, intent=${analysis.intentAlignment}, auditReady=${analysis.auditReadiness}, files=${filesChanged.length}`);

    // Update GitHub Check with AI analysis results
    if (installationId && headSha) {
      try {
        const gaps = await getGapsForCheck(derId);
        await updateEvidenceCheck({
          installationId,
          owner,
          repo: repoName,
          headSha,
          prNumber,
          derId,
          evidenceScore: updatedDer.evidenceScore,
          gaps,
          prTitle: updatedDer.prTitle,
          aiDocQuality: analysis.documentationQuality,
          aiAuditReadiness: analysis.auditReadiness,
        });
        console.log(`[AI Analysis] Updated GitHub Check for PR #${prNumber} with AI results`);
      } catch (checkError) {
        console.error("[AI Analysis] Failed to update GitHub Check:", checkError);
      }
    }
  } catch (error) {
    console.error("[AI Analysis] Error:", error);
    // Don't throw - we don't want to fail silently but also not crash
  }
}
