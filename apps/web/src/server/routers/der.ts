import { z } from "zod";
import { router, orgProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { generateAuditSummary, analyzeChangeRisk } from "@/lib/ai-analysis";
import { getInstallationOctokit } from "@/lib/github";
import { recalculateGapsAndScore, getGapsForCheck } from "@/lib/der-recalculate";
import { updateEvidenceCheck, getPullRequestHeadSha } from "@/lib/github-checks";
import { verifyVaultIntegrity, getVaultSummary, createEvidenceVault } from "@/lib/evidence-vault";

// Helper to get the database organization ID from Clerk org ID
async function getOrganization(prisma: any, clerkOrgId: string) {
  const org = await prisma.organization.findFirst({
    where: { clerkOrgId },
  });

  if (!org) {
    console.log("[DER Router] Organization not found for clerkOrgId:", clerkOrgId);
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found. Please ensure your organization is set up.",
    });
  }

  console.log("[DER Router] Found organization:", { clerkOrgId, dbId: org.id, name: org.name });
  return org;
}

export const derRouter = router({
  list: orgProcedure
    .input(
      z.object({
        status: z
          .enum(["PENDING", "NEEDS_REVIEW", "CONFIRMED", "COMPLETE", "INCOMPLETE"])
          .optional(),
        repositoryId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("[DER Router] list called with clerkOrgId:", ctx.orgId);

      try {
        const org = await getOrganization(ctx.prisma, ctx.orgId);

        const records = await ctx.prisma.decisionEvidenceRecord.findMany({
          where: {
            organizationId: org.id,
            ...(input.status && { status: input.status }),
            ...(input.repositoryId && { repositoryId: input.repositoryId }),
            ...(input.search && {
              OR: [
                { prTitle: { contains: input.search, mode: "insensitive" } },
                { prNumber: { equals: parseInt(input.search) || -1 } },
              ],
            }),
          },
          include: {
            repository: true,
            gaps: { where: { resolved: false } },
            _count: { select: { reviews: true, comments: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: input.limit + 1,
          cursor: input.cursor ? { id: input.cursor } : undefined,
        });

        console.log("[DER Router] list found", records.length, "records");

        let nextCursor: string | undefined;
        if (records.length > input.limit) {
          const nextItem = records.pop();
          nextCursor = nextItem?.id;
        }

        return { records, nextCursor };
      } catch (error) {
        console.error("[DER Router] list error:", error);
        throw error;
      }
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      console.log("[DER Router] getById called with:", {
        recordId: input.id,
        clerkOrgId: ctx.orgId,
        dbOrgId: org.id,
      });

      const record = await ctx.prisma.decisionEvidenceRecord.findFirst({
        where: { id: input.id, organizationId: org.id },
        include: {
          repository: true,
          evidenceItems: { orderBy: { capturedAt: "desc" } },
          gaps: { orderBy: { createdAt: "desc" } },
          reviews: { orderBy: { submittedAt: "desc" } },
          comments: { orderBy: { createdAt: "desc" } },
          confirmations: {
            include: { user: true },
            orderBy: { confirmedAt: "desc" },
          },
        },
      });

      console.log("[DER Router] getById result:", record ? { id: record.id, prTitle: record.prTitle } : "NOT FOUND");

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      }

      return record;
    }),

  confirm: orgProcedure
    .input(z.object({ derId: z.string(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      const user = await ctx.prisma.user.findFirst({
        where: { clerkUserId: ctx.userId, organizationId: org.id },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const record = await ctx.prisma.decisionEvidenceRecord.findFirst({
        where: { id: input.derId, organizationId: org.id },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      }

      const confirmation = await ctx.prisma.evidenceConfirmation.create({
        data: {
          derId: input.derId,
          userId: user.id,
          note: input.note,
        },
      });

      // Update status to CONFIRMED if not already complete
      if (record.status !== "COMPLETE") {
        await ctx.prisma.decisionEvidenceRecord.update({
          where: { id: input.derId },
          data: { status: "CONFIRMED" },
        });
      }

      return confirmation;
    }),

  getStats: orgProcedure.query(async ({ ctx }) => {
    console.log("[DER Router] getStats called with clerkOrgId:", ctx.orgId);

    const org = await getOrganization(ctx.prisma, ctx.orgId);

    const [total, pending, needsReview, avgScore, thisWeek] = await Promise.all([
      ctx.prisma.decisionEvidenceRecord.count({
        where: { organizationId: org.id },
      }),
      ctx.prisma.decisionEvidenceRecord.count({
        where: { organizationId: org.id, status: "PENDING" },
      }),
      ctx.prisma.decisionEvidenceRecord.count({
        where: { organizationId: org.id, status: "NEEDS_REVIEW" },
      }),
      ctx.prisma.decisionEvidenceRecord.aggregate({
        where: { organizationId: org.id },
        _avg: { evidenceScore: true },
      }),
      ctx.prisma.decisionEvidenceRecord.count({
        where: {
          organizationId: org.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    console.log("[DER Router] getStats results:", { total, pending, needsReview, thisWeek });

    return {
      total,
      pending,
      needsReview,
      avgScore: Math.round(avgScore._avg.evidenceScore || 0),
      thisWeek,
    };
  }),

  getNeedsAttention: orgProcedure.query(async ({ ctx }) => {
    console.log("[DER Router] getNeedsAttention called with clerkOrgId:", ctx.orgId);

    const org = await getOrganization(ctx.prisma, ctx.orgId);

    const records = await ctx.prisma.decisionEvidenceRecord.findMany({
      where: {
        organizationId: org.id,
        OR: [
          { status: "NEEDS_REVIEW" },
          { status: "PENDING" },
          { gaps: { some: { resolved: false } } },
        ],
      },
      include: {
        repository: true,
        gaps: { where: { resolved: false } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    console.log("[DER Router] getNeedsAttention found", records.length, "records");

    return records;
  }),

  generateAuditSummary: orgProcedure
    .input(z.object({ derId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      const record = await ctx.prisma.decisionEvidenceRecord.findFirst({
        where: { id: input.derId, organizationId: org.id },
        include: {
          reviews: true,
          gaps: true,
        },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      }

      // Generate audit summary using AI
      const auditResult = await generateAuditSummary({
        prTitle: record.prTitle,
        prAuthor: record.prAuthor,
        description: record.description,
        ticketLinks: record.ticketLinks,
        slackThreads: record.slackThreads,
        evidenceScore: record.evidenceScore,
        reviews: record.reviews.map((r) => ({
          author: r.author,
          state: r.state,
          body: r.body,
        })),
        gaps: record.gaps.map((g) => ({
          type: g.type,
          message: g.message,
          resolved: g.resolved,
        })),
        createdAt: record.createdAt,
      });

      // Update the record with the summary
      await ctx.prisma.decisionEvidenceRecord.update({
        where: { id: input.derId },
        data: {
          aiSummary: auditResult.summary,
          aiAuditReadiness: auditResult.auditReadiness,
          aiAnalyzedAt: new Date(),
        },
      });

      return auditResult;
    }),

  recalculateScore: orgProcedure
    .input(z.object({ derId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      // Verify the record exists and belongs to this org (include repo for GitHub check)
      const record = await ctx.prisma.decisionEvidenceRecord.findFirst({
        where: { id: input.derId, organizationId: org.id },
        include: {
          repository: {
            include: {
              gitHubInstallation: true,
            },
          },
        },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      }

      console.log(`[recalculateScore tRPC] Called for DER: ${input.derId}`);

      // Recalculate gaps and score
      const result = await recalculateGapsAndScore(input.derId);

      if (!result) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to recalculate score" });
      }

      console.log(`[recalculateScore tRPC] Result:`, {
        evidenceScore: result.evidenceScore,
        gapsCount: result.gaps.length,
        scoreInput: result.scoreInput,
      });

      // Update GitHub Check with new score
      const installation = record.repository.gitHubInstallation;
      if (installation) {
        try {
          console.log(`[recalculateScore tRPC] Updating GitHub Check...`);
          const [owner, repoName] = record.repository.fullName.split("/");

          // Get the current head SHA for the PR
          const headSha = await getPullRequestHeadSha(
            installation.installationId,
            owner,
            repoName,
            record.prNumber
          );

          const gaps = await getGapsForCheck(input.derId);

          await updateEvidenceCheck({
            installationId: installation.installationId,
            owner,
            repo: repoName,
            headSha,
            prNumber: record.prNumber,
            derId: input.derId,
            evidenceScore: result.evidenceScore,
            gaps,
            prTitle: record.prTitle,
            aiDocQuality: record.aiDocQuality,
            aiAuditReadiness: record.aiAuditReadiness,
          });

          console.log(`[recalculateScore tRPC] GitHub Check updated successfully`);
        } catch (checkError) {
          console.error(`[recalculateScore tRPC] Failed to update GitHub Check (non-fatal):`, checkError);
        }
      }

      return {
        evidenceScore: result.evidenceScore,
        gaps: result.gaps,
        scoreInput: result.scoreInput,
      };
    }),

  reanalyzeRisk: orgProcedure
    .input(z.object({ derId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log(`[reanalyzeRisk] Starting for DER: ${input.derId}`);

      const org = await getOrganization(ctx.prisma, ctx.orgId);

      const record = await ctx.prisma.decisionEvidenceRecord.findFirst({
        where: { id: input.derId, organizationId: org.id },
        include: {
          repository: {
            include: {
              gitHubInstallation: true,
            },
          },
        },
      });

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      }

      console.log(`[reanalyzeRisk] Found record: ${record.prTitle}`);

      // Get files and diff from GitHub if we have installation
      let filesChanged: string[] = record.filesChanged || [];
      let diff: string | null = null;

      const installation = record.repository.gitHubInstallation;
      if (installation) {
        try {
          console.log(`[reanalyzeRisk] Fetching files from GitHub...`);
          const octokit = await getInstallationOctokit(installation.installationId);
          const [owner, repoName] = record.repository.fullName.split("/");

          // Get files changed
          const { data: files } = await octokit.pulls.listFiles({
            owner,
            repo: repoName,
            pull_number: record.prNumber,
            per_page: 100,
          });

          filesChanged = files.map(f => f.filename);
          console.log(`[reanalyzeRisk] Got ${filesChanged.length} files from GitHub`);

          // Build diff from patches
          const diffParts: string[] = [];
          let totalDiffLength = 0;
          const maxDiffLength = 10000;

          for (const file of files) {
            if (file.patch && totalDiffLength < maxDiffLength) {
              const fileDiff = `diff --git a/${file.filename} b/${file.filename}\n--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`;
              diffParts.push(fileDiff);
              totalDiffLength += fileDiff.length;
            }
          }
          diff = diffParts.join("\n\n");
        } catch (error) {
          console.error("[reanalyzeRisk] Failed to fetch from GitHub:", error);
        }
      }

      // Run AI analysis
      console.log(`[reanalyzeRisk] Running AI analysis...`);
      const analysis = await analyzeChangeRisk(
        record.prTitle,
        record.description,
        filesChanged,
        diff
      );

      console.log(`[reanalyzeRisk] AI analysis complete:`, {
        documentationQuality: analysis.documentationQuality,
        intentAlignment: analysis.intentAlignment,
        auditReadiness: analysis.auditReadiness,
        missingContextCount: analysis.missingContext?.length || 0,
        suggestionsCount: analysis.suggestions?.length || 0,
      });

      // Ensure arrays are valid (not undefined)
      const safeMissingContext = Array.isArray(analysis.missingContext) ? analysis.missingContext : [];
      const safeSuggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions : [];

      // Update record with AI analysis
      try {
        console.log(`[reanalyzeRisk] Saving to database...`);

        const updateData = {
          aiDocQuality: analysis.documentationQuality,
          aiIntentAlignment: analysis.intentAlignment,
          aiAuditReadiness: analysis.auditReadiness,
          aiMissingContext: safeMissingContext,
          aiSuggestions: safeSuggestions,
          aiSummary: analysis.summary,
          filesChanged: filesChanged || [],
          aiAnalyzedAt: new Date(),
        };

        console.log(`[reanalyzeRisk] Update data:`, JSON.stringify(updateData, null, 2));

        await ctx.prisma.decisionEvidenceRecord.update({
          where: { id: input.derId },
          data: updateData,
        });

        console.log(`[reanalyzeRisk] Database update successful`);
      } catch (dbError) {
        console.error(`[reanalyzeRisk] Database update FAILED:`, dbError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save AI analysis: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
        });
      }

      // Also recalculate gaps and evidence score
      let recalcResult;
      try {
        console.log(`[reanalyzeRisk] Recalculating gaps and score...`);
        recalcResult = await recalculateGapsAndScore(input.derId);
        console.log(`[reanalyzeRisk] Recalculated: score=${recalcResult?.evidenceScore}, gaps=${recalcResult?.gaps.length}`);
      } catch (recalcError) {
        console.error(`[reanalyzeRisk] Recalculation failed (non-fatal):`, recalcError);
        // Don't throw - the AI analysis was saved successfully
      }

      // Update GitHub Check with AI analysis results
      if (installation && recalcResult) {
        try {
          console.log(`[reanalyzeRisk] Updating GitHub Check...`);
          const [owner, repoName] = record.repository.fullName.split("/");

          // Get the current head SHA for the PR
          const headSha = await getPullRequestHeadSha(
            installation.installationId,
            owner,
            repoName,
            record.prNumber
          );

          const gaps = await getGapsForCheck(input.derId);

          await updateEvidenceCheck({
            installationId: installation.installationId,
            owner,
            repo: repoName,
            headSha,
            prNumber: record.prNumber,
            derId: input.derId,
            evidenceScore: recalcResult.evidenceScore,
            gaps,
            prTitle: record.prTitle,
            aiDocQuality: analysis.documentationQuality,
            aiAuditReadiness: analysis.auditReadiness,
          });

          console.log(`[reanalyzeRisk] GitHub Check updated successfully`);
        } catch (checkError) {
          console.error(`[reanalyzeRisk] Failed to update GitHub Check (non-fatal):`, checkError);
          // Don't throw - the AI analysis was saved successfully
        }
      }

      console.log(`[reanalyzeRisk] Complete - returning analysis`);
      return analysis;
    }),

  // ============ EVIDENCE VAULT ENDPOINTS ============

  getVault: orgProcedure
    .input(z.object({ derId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        console.log("[getVault] Looking for vault for DER:", input.derId);

        const org = await getOrganization(ctx.prisma, ctx.orgId);

        // Verify the DER belongs to this org
        const der = await ctx.prisma.decisionEvidenceRecord.findFirst({
          where: { id: input.derId, organizationId: org.id },
        });

        if (!der) {
          console.log("[getVault] DER not found");
          throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
        }

        const vault = await ctx.prisma.evidenceVault.findUnique({
          where: { decisionRecordId: input.derId },
        });

        console.log("[getVault] Found vault:", vault ? vault.id : "no");
        return vault;
      } catch (error) {
        console.error("[getVault] Error:", error);
        throw error;
      }
    }),

  getVaultSummary: orgProcedure
    .input(z.object({ derId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        console.log("[getVaultSummary] Looking for vault for DER:", input.derId);

        const org = await getOrganization(ctx.prisma, ctx.orgId);

        // Verify the DER belongs to this org
        const der = await ctx.prisma.decisionEvidenceRecord.findFirst({
          where: { id: input.derId, organizationId: org.id },
        });

        if (!der) {
          console.log("[getVaultSummary] DER not found");
          throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
        }

        const vault = await ctx.prisma.evidenceVault.findUnique({
          where: { decisionRecordId: input.derId },
        });

        console.log("[getVaultSummary] Found vault:", vault ? vault.id : "no");

        if (!vault) {
          return null;
        }

        const summary = await getVaultSummary(vault.id);
        console.log("[getVaultSummary] Summary generated:", summary ? "yes" : "no");
        return summary;
      } catch (error) {
        console.error("[getVaultSummary] Error:", error);
        throw error;
      }
    }),

  verifyVault: orgProcedure
    .input(z.object({ vaultId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      // Verify the vault belongs to this org
      const vault = await ctx.prisma.evidenceVault.findFirst({
        where: { id: input.vaultId, organizationId: org.id },
      });

      if (!vault) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vault not found" });
      }

      return verifyVaultIntegrity(input.vaultId);
    }),

  createVault: orgProcedure
    .input(z.object({ derId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("[createVault] Creating vault for DER:", input.derId);

        const org = await getOrganization(ctx.prisma, ctx.orgId);

        // Verify the DER belongs to this org and is merged
        const der = await ctx.prisma.decisionEvidenceRecord.findFirst({
          where: { id: input.derId, organizationId: org.id },
        });

        if (!der) {
          console.log("[createVault] DER not found");
          throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
        }

        console.log("[createVault] DER state:", der.prState);

        if (der.prState !== "MERGED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot create vault for non-merged PR",
          });
        }

        // Check if vault already exists
        const existing = await ctx.prisma.evidenceVault.findUnique({
          where: { decisionRecordId: input.derId },
        });

        if (existing) {
          console.log("[createVault] Vault already exists:", existing.id);
          return { vaultId: existing.id, created: false };
        }

        // Get the user who is creating the vault
        const user = await ctx.prisma.user.findFirst({
          where: { clerkUserId: ctx.userId, organizationId: org.id },
        });

        const mergedBy = der.prAuthor; // Use PR author if we don't have merged_by
        console.log("[createVault] Creating new vault, mergedBy:", mergedBy);

        const vaultId = await createEvidenceVault(input.derId, mergedBy);
        console.log("[createVault] Vault created:", vaultId);

        // Update sealedBy to the current user
        if (user) {
          await ctx.prisma.evidenceVault.update({
            where: { id: vaultId },
            data: { sealedBy: user.email },
          });
        }

        return { vaultId, created: true };
      } catch (error) {
        console.error("[createVault] Error:", error);
        throw error;
      }
    }),
});
