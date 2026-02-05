import { z } from "zod";
import { router, orgProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Helper to get the database organization ID from Clerk org ID
async function getOrganization(prisma: any, clerkOrgId: string) {
  const org = await prisma.organization.findFirst({
    where: { clerkOrgId },
  });

  if (!org) {
    console.log("[Settings Router] Organization not found for clerkOrgId:", clerkOrgId);
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found. Please ensure your organization is set up.",
    });
  }

  return org;
}

export const settingsRouter = router({
  get: orgProcedure.query(async ({ ctx }) => {
    console.log("[Settings Router] get called with clerkOrgId:", ctx.orgId);

    const org = await getOrganization(ctx.prisma, ctx.orgId);

    let settings = await ctx.prisma.organizationSettings.findUnique({
      where: { organizationId: org.id },
    });

    // Create default settings if they don't exist
    if (!settings) {
      console.log("[Settings Router] Creating default settings for org:", org.id);
      settings = await ctx.prisma.organizationSettings.create({
        data: {
          organizationId: org.id,
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
      console.log("[Settings Router] update called with clerkOrgId:", ctx.orgId);

      const org = await getOrganization(ctx.prisma, ctx.orgId);

      return ctx.prisma.organizationSettings.upsert({
        where: { organizationId: org.id },
        create: {
          organizationId: org.id,
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
