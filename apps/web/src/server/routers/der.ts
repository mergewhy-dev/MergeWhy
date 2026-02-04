import { z } from "zod";
import { router, orgProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

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
      const records = await ctx.prisma.decisionEvidenceRecord.findMany({
        where: {
          organizationId: ctx.orgId,
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

      let nextCursor: string | undefined;
      if (records.length > input.limit) {
        const nextItem = records.pop();
        nextCursor = nextItem?.id;
      }

      return { records, nextCursor };
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.prisma.decisionEvidenceRecord.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
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

      if (!record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Record not found" });
      }

      return record;
    }),

  confirm: orgProcedure
    .input(z.object({ derId: z.string(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { clerkUserId: ctx.userId, organizationId: ctx.orgId },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const record = await ctx.prisma.decisionEvidenceRecord.findFirst({
        where: { id: input.derId, organizationId: ctx.orgId },
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
    const [total, pending, needsReview, avgScore, thisWeek] = await Promise.all([
      ctx.prisma.decisionEvidenceRecord.count({
        where: { organizationId: ctx.orgId },
      }),
      ctx.prisma.decisionEvidenceRecord.count({
        where: { organizationId: ctx.orgId, status: "PENDING" },
      }),
      ctx.prisma.decisionEvidenceRecord.count({
        where: { organizationId: ctx.orgId, status: "NEEDS_REVIEW" },
      }),
      ctx.prisma.decisionEvidenceRecord.aggregate({
        where: { organizationId: ctx.orgId },
        _avg: { evidenceScore: true },
      }),
      ctx.prisma.decisionEvidenceRecord.count({
        where: {
          organizationId: ctx.orgId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      pending,
      needsReview,
      avgScore: Math.round(avgScore._avg.evidenceScore || 0),
      thisWeek,
    };
  }),

  getNeedsAttention: orgProcedure.query(async ({ ctx }) => {
    return ctx.prisma.decisionEvidenceRecord.findMany({
      where: {
        organizationId: ctx.orgId,
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
  }),
});
