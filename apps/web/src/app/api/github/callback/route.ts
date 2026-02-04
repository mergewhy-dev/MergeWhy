import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@mergewhy/database";
import { getInstallationOctokit } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.redirect(
      new URL("/sign-in?error=unauthorized", request.url)
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");

  if (!installationId) {
    return NextResponse.redirect(
      new URL("/repositories?error=missing_installation", request.url)
    );
  }

  try {
    // Get the installation details from GitHub
    const octokit = await getInstallationOctokit(parseInt(installationId));

    // Get repositories accessible to this installation
    const { data: installationData } = await octokit.apps.listReposAccessibleToInstallation();

    // Find or create the organization
    let organization = await prisma.organization.findFirst({
      where: { clerkOrgId: orgId },
    });

    if (!organization) {
      // Create organization if it doesn't exist
      const orgSlug = orgId.toLowerCase().replace(/[^a-z0-9]/g, "-");
      organization = await prisma.organization.create({
        data: {
          name: orgSlug,
          slug: orgSlug,
          clerkOrgId: orgId,
        },
      });
    }

    // Create or update the GitHub installation
    const installation = await prisma.gitHubInstallation.upsert({
      where: { installationId: parseInt(installationId) },
      create: {
        installationId: parseInt(installationId),
        organizationId: organization.id,
        accountLogin: installationData.repositories?.[0]?.owner?.login || "unknown",
        accountType: "Organization",
      },
      update: {
        organizationId: organization.id,
      },
    });

    // Create repository records
    for (const repo of installationData.repositories || []) {
      await prisma.repository.upsert({
        where: { githubId: repo.id },
        create: {
          githubId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          organizationId: organization.id,
          gitHubInstallationId: installation.id,
          isActive: true,
          defaultBranch: repo.default_branch || "main",
        },
        update: {
          name: repo.name,
          fullName: repo.full_name,
          defaultBranch: repo.default_branch || "main",
        },
      });
    }

    console.log(
      `GitHub App installed: ${installationId}, ${installationData.repositories?.length || 0} repos`
    );

    // Redirect back to repositories page
    return NextResponse.redirect(
      new URL("/repositories?success=installation_complete", request.url)
    );
  } catch (error) {
    console.error("GitHub callback error:", error);
    return NextResponse.redirect(
      new URL("/repositories?error=installation_failed", request.url)
    );
  }
}
