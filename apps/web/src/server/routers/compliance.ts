import { z } from "zod";
import { router, orgProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  evaluateCompliance,
  buildDEREvidence,
  type ComplianceResult,
} from "@/lib/compliance-engines";

// Helper to get the database organization ID from Clerk org ID
async function getOrganization(prisma: any, clerkOrgId: string) {
  const org = await prisma.organization.findFirst({
    where: { clerkOrgId },
  });

  if (!org) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found.",
    });
  }

  return org;
}

export const complianceRouter = router({
  // List all available compliance frameworks
  listFrameworks: publicProcedure.query(async ({ ctx }) => {
    const frameworks = await ctx.prisma.complianceFramework.findMany({
      include: {
        controls: true,
      },
      orderBy: { name: "asc" },
    });

    return frameworks.map((fw) => ({
      id: fw.id,
      name: fw.name,
      shortCode: fw.shortCode,
      description: fw.description,
      icon: fw.icon,
      controlCount: fw.controls.length,
      controls: fw.controls.map((ctrl) => ({
        id: ctrl.id,
        controlId: ctrl.controlId,
        name: ctrl.name,
        description: ctrl.description,
        category: ctrl.category,
        requiresApproval: ctrl.requiresApproval,
        requiresReview: ctrl.requiresReview,
        requiresTicketLink: ctrl.requiresTicketLink,
        requiresDescription: ctrl.requiresDescription,
        requiresRiskAssessment: ctrl.requiresRiskAssessment,
        minReviewers: ctrl.minReviewers,
      })),
    }));
  }),

  // Get frameworks enabled for the current organization
  getOrganizationFrameworks: orgProcedure.query(async ({ ctx }) => {
    const org = await getOrganization(ctx.prisma, ctx.orgId);

    const orgFrameworks = await ctx.prisma.organizationFramework.findMany({
      where: {
        organizationId: org.id,
        isActive: true,
      },
      include: {
        framework: {
          include: {
            controls: true,
          },
        },
      },
    });

    return orgFrameworks.map((of) => ({
      id: of.id,
      frameworkId: of.framework.id,
      name: of.framework.name,
      shortCode: of.framework.shortCode,
      description: of.framework.description,
      icon: of.framework.icon,
      enabledAt: of.enabledAt,
      controlCount: of.framework.controls.length,
      controls: of.framework.controls,
    }));
  }),

  // Enable a framework for the organization
  enableFramework: orgProcedure
    .input(z.object({ frameworkId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      // Verify framework exists
      const framework = await ctx.prisma.complianceFramework.findUnique({
        where: { id: input.frameworkId },
      });

      if (!framework) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Framework not found.",
        });
      }

      // Upsert to handle both create and re-enable
      const orgFramework = await ctx.prisma.organizationFramework.upsert({
        where: {
          organizationId_frameworkId: {
            organizationId: org.id,
            frameworkId: input.frameworkId,
          },
        },
        create: {
          organizationId: org.id,
          frameworkId: input.frameworkId,
          isActive: true,
        },
        update: {
          isActive: true,
          enabledAt: new Date(),
        },
        include: {
          framework: true,
        },
      });

      return {
        success: true,
        frameworkName: orgFramework.framework.name,
      };
    }),

  // Disable a framework for the organization
  disableFramework: orgProcedure
    .input(z.object({ frameworkId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      const orgFramework = await ctx.prisma.organizationFramework.updateMany({
        where: {
          organizationId: org.id,
          frameworkId: input.frameworkId,
        },
        data: {
          isActive: false,
        },
      });

      return {
        success: orgFramework.count > 0,
      };
    }),

  // Get compliance status for all enabled frameworks
  getComplianceStatus: orgProcedure.query(async ({ ctx }) => {
    const org = await getOrganization(ctx.prisma, ctx.orgId);

    // Get enabled frameworks with controls
    const orgFrameworks = await ctx.prisma.organizationFramework.findMany({
      where: {
        organizationId: org.id,
        isActive: true,
      },
      include: {
        framework: {
          include: {
            controls: true,
          },
        },
      },
    });

    // Get recent DERs for compliance calculation (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDERs = await ctx.prisma.decisionEvidenceRecord.findMany({
      where: {
        organizationId: org.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        reviews: true,
        gaps: true,
      },
    });

    // Calculate compliance for each framework
    const frameworkStatus = orgFrameworks.map((of) => {
      const framework = of.framework;
      const controls = framework.controls;

      // For each control, check if requirements are met across DERs
      const controlStatuses = controls.map((control) => {
        // Calculate compliance based on DERs meeting this control's requirements
        let compliantDERs = 0;
        let totalDERs = recentDERs.length;

        for (const der of recentDERs) {
          let meetsRequirements = true;

          // Check approval requirement
          if (control.requiresApproval) {
            const hasApproval = der.reviews.some((r) => r.state === "APPROVED");
            if (!hasApproval) meetsRequirements = false;
          }

          // Check review requirement
          if (control.requiresReview) {
            const hasReview = der.reviews.length > 0;
            if (!hasReview) meetsRequirements = false;
          }

          // Check ticket link requirement
          if (control.requiresTicketLink) {
            const hasTicket = der.ticketLinks.length > 0;
            if (!hasTicket) meetsRequirements = false;
          }

          // Check description requirement
          if (control.requiresDescription) {
            const hasDescription =
              der.description && der.description.trim().length > 0;
            if (!hasDescription) meetsRequirements = false;
          }

          // Check minimum reviewers
          if (control.minReviewers > 0) {
            const approvalCount = der.reviews.filter(
              (r) => r.state === "APPROVED"
            ).length;
            if (approvalCount < control.minReviewers)
              meetsRequirements = false;
          }

          if (meetsRequirements) compliantDERs++;
        }

        const complianceRate =
          totalDERs > 0 ? (compliantDERs / totalDERs) * 100 : 100;

        return {
          controlId: control.controlId,
          name: control.name,
          category: control.category,
          compliantDERs,
          totalDERs,
          complianceRate: Math.round(complianceRate),
          isCompliant: complianceRate >= 80, // 80% threshold for compliance
        };
      });

      // Calculate overall framework compliance
      const compliantControls = controlStatuses.filter(
        (c) => c.isCompliant
      ).length;
      const totalControls = controlStatuses.length;
      const overallCompliance =
        totalControls > 0 ? (compliantControls / totalControls) * 100 : 0;

      return {
        frameworkId: framework.id,
        name: framework.name,
        shortCode: framework.shortCode,
        icon: framework.icon,
        compliantControls,
        totalControls,
        overallCompliance: Math.round(overallCompliance),
        controls: controlStatuses,
      };
    });

    return {
      frameworks: frameworkStatus,
      totalDERs: recentDERs.length,
      period: "30 days",
    };
  }),

  // Evaluate compliance for a specific DER
  evaluateDER: orgProcedure
    .input(z.object({ derId: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await getOrganization(ctx.prisma, ctx.orgId);

      // Fetch the DER with all related evidence
      const der = await ctx.prisma.decisionEvidenceRecord.findFirst({
        where: {
          id: input.derId,
          organizationId: org.id,
        },
        include: {
          reviews: true,
          gaps: true,
        },
      });

      if (!der) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Decision Evidence Record not found.",
        });
      }

      // Get enabled frameworks for the organization
      const orgFrameworks = await ctx.prisma.organizationFramework.findMany({
        where: {
          organizationId: org.id,
          isActive: true,
        },
        include: {
          framework: true,
        },
      });

      const enabledFrameworkCodes = orgFrameworks.map(
        (of) => of.framework.shortCode
      );

      // If no frameworks enabled, return empty results
      if (enabledFrameworkCodes.length === 0) {
        return {
          derId: input.derId,
          results: [] as ComplianceResult[],
          evaluatedAt: new Date().toISOString(),
          enabledFrameworks: [],
        };
      }

      // Build evidence object from DER
      const evidence = buildDEREvidence({
        description: der.description,
        ticketLinks: der.ticketLinks,
        slackThreads: der.slackThreads,
        prAuthor: der.prAuthor,
        filesChanged: der.filesChanged,
        aiDocQuality: der.aiDocQuality,
        aiAuditReadiness: der.aiAuditReadiness,
        reviews: der.reviews.map((r) => ({
          author: r.author,
          state: r.state,
        })),
        gaps: der.gaps.map((g) => ({
          resolved: g.resolved,
        })),
      });

      // Evaluate compliance against all enabled frameworks
      const results = evaluateCompliance(evidence, enabledFrameworkCodes);

      return {
        derId: input.derId,
        results,
        evaluatedAt: new Date().toISOString(),
        enabledFrameworks: enabledFrameworkCodes,
        evidence: {
          hasDescription: evidence.hasDescription,
          descriptionLength: evidence.descriptionLength,
          ticketCount: evidence.ticketCount,
          reviewCount: evidence.reviewCount,
          approvalCount: evidence.approvalCount,
          hasSelfApproval: evidence.hasSelfApproval,
          filesChangedCount: evidence.filesChanged.length,
        },
      };
    }),
});
