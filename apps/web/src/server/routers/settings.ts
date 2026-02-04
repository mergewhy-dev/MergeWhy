import { z } from "zod";
import { router, orgProcedure } from "../trpc";

export const settingsRouter = router({
  get: orgProcedure.query(async ({ ctx }) => {
    let settings = await ctx.prisma.organizationSettings.findUnique({
      where: { organizationId: ctx.orgId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await ctx.prisma.organizationSettings.create({
        data: {
          organizationId: ctx.orgId,
          requireTicketLink: true,
          requireDescription: true,
          minReviewers: 1,
          blockMergeOnGaps: false,
        },
      });
    }

    return settings;
  }),

  update: orgProcedure
    .input(
      z.object({
        requireTicketLink: z.boolean().optional(),
        requireDescription: z.boolean().optional(),
        minReviewers: z.number().min(0).max(10).optional(),
        blockMergeOnGaps: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.organizationSettings.upsert({
        where: { organizationId: ctx.orgId },
        create: {
          organizationId: ctx.orgId,
          requireTicketLink: input.requireTicketLink ?? true,
          requireDescription: input.requireDescription ?? true,
          minReviewers: input.minReviewers ?? 1,
          blockMergeOnGaps: input.blockMergeOnGaps ?? false,
        },
        update: {
          ...(input.requireTicketLink !== undefined && {
            requireTicketLink: input.requireTicketLink,
          }),
          ...(input.requireDescription !== undefined && {
            requireDescription: input.requireDescription,
          }),
          ...(input.minReviewers !== undefined && {
            minReviewers: input.minReviewers,
          }),
          ...(input.blockMergeOnGaps !== undefined && {
            blockMergeOnGaps: input.blockMergeOnGaps,
          }),
        },
      });
    }),
});
