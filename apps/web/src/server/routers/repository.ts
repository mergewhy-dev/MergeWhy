import { z } from "zod";
import { router, orgProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Helper to get the database organization ID from Clerk org ID
async function getOrganization(prisma: any, clerkOrgId: string) {
  const org = await prisma.organization.findFirst({
    where: { clerkOrgId },
  });

  if (!org) {
    console.log("[Repository Router] Organization not found for clerkOrgId:", clerkOrgId);
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found. Please ensure your organization is set up.",
    });
  }

  return org;
}

export const repositoryRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    console.log("[Repository Router] list called with clerkOrgId:", ctx.orgId);

    const org = await getOrganization(ctx.prisma, ctx.orgId);

    const repositories = await ctx.prisma.repository.findMany({
      where: { organizationId: org.id },
      include: {
        _count: { select: { decisionRecords: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    console.log("[Repository Router] list found", repositories.length, "repositories");

    // Get stats for each repository
    const reposWithStats = await Promise.all(
      repositories.map(async (repo) => {
        const [avgScore, pendingCount] = await Promise.all([
          ctx.prisma.decisionEvidenceRecord.aggregate({
            where: { repositoryId: repo.id },
            _avg: { evidenceScore: true },
          }),
          ctx.prisma.decisionEvidenceRecord.count({
            where: {
              repositoryId: repo.id,
              status: { in: ["PENDING", "NEEDS_REVIEW"] },
            },
          }),
        ]);

        return {
          ...repo,
          totalDERs: repo._count.decisionRecords,
          avgScore: Math.round(avgScore._avg.evidenceScore || 0),
          pendingCount,
        };
      })
    );

    return reposWithStats;
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      const repository = await ctx.prisma.repository.findFirst({
        where: { id: input.id, organizationId: org.id },
        include: {
          gitHubInstallation: true,
          _count: { select: { decisionRecords: true } },
        },
      });

      if (!repository) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      const [avgScore, recentDERs, statusCounts] = await Promise.all([
        ctx.prisma.decisionEvidenceRecord.aggregate({
          where: { repositoryId: repository.id },
          _avg: { evidenceScore: true },
        }),
        ctx.prisma.decisionEvidenceRecord.findMany({
          where: { repositoryId: repository.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { gaps: { where: { resolved: false } } },
        }),
        ctx.prisma.decisionEvidenceRecord.groupBy({
          by: ["status"],
          where: { repositoryId: repository.id },
          _count: { status: true },
        }),
      ]);

      return {
        ...repository,
        totalDERs: repository._count.decisionRecords,
        avgScore: Math.round(avgScore._avg.evidenceScore || 0),
        recentDERs,
        statusCounts: statusCounts.reduce(
          (acc, item) => ({ ...acc, [item.status]: item._count.status }),
          {} as Record<string, number>
        ),
      };
    }),

  updateSettings: orgProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        defaultBranch: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      const repository = await ctx.prisma.repository.findFirst({
        where: { id: input.id, organizationId: org.id },
      });

      if (!repository) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found" });
      }

      return ctx.prisma.repository.update({
        where: { id: input.id },
        data: {
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          ...(input.defaultBranch && { defaultBranch: input.defaultBranch }),
        },
      });
    }),

  getStats: orgProcedure.query(async ({ ctx }) => {
    console.log("[Repository Router] getStats called with clerkOrgId:", ctx.orgId);

    const org = await getOrganization(ctx.prisma, ctx.orgId);

    const [total, active, totalDERs] = await Promise.all([
      ctx.prisma.repository.count({ where: { organizationId: org.id } }),
      ctx.prisma.repository.count({ where: { organizationId: org.id, isActive: true } }),
      ctx.prisma.decisionEvidenceRecord.count({ where: { organizationId: org.id } }),
    ]);

    console.log("[Repository Router] getStats results:", { total, active, totalDERs });

    return { total, active, totalDERs };
  }),
});
