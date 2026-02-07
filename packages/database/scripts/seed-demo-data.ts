import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALLTIME_ORG_ID = 'cml83gttx0006nqwbkp8ga1vb';
const ALLTIME_CLERK_ID = 'org_39CwCX5AyvOVEy808ynhlU395Zj';

async function seed() {
  console.log('Seeding demo data for AllTime organization...\n');

  // Ensure AllTime org exists
  const org = await prisma.organization.upsert({
    where: { id: ALLTIME_ORG_ID },
    update: {},
    create: {
      id: ALLTIME_ORG_ID,
      clerkOrgId: ALLTIME_CLERK_ID,
      name: 'AllTime',
      slug: 'alltime',
    },
  });
  console.log('✓ Organization:', org.name);

  // Create a GitHub Installation
  const installation = await prisma.gitHubInstallation.upsert({
    where: { installationId: 107961297 },
    update: { organizationId: ALLTIME_ORG_ID },
    create: {
      installationId: 107961297,
      accountLogin: 'nagasatyadheerajanumala',
      accountType: 'User',
      organizationId: ALLTIME_ORG_ID,
    },
  });
  console.log('✓ GitHub Installation:', installation.accountLogin);

  // Create Repository
  const repo = await prisma.repository.upsert({
    where: { githubId: 929007541 },
    update: { organizationId: ALLTIME_ORG_ID },
    create: {
      organizationId: ALLTIME_ORG_ID,
      githubId: 929007541,
      name: 'AllTime',
      fullName: 'nagasatyadheerajanumala/AllTime',
      defaultBranch: 'main',
      gitHubInstallationId: installation.id,
    },
  });
  console.log('✓ Repository:', repo.fullName);

  // Create sample Decision Evidence Records
  const sampleDERs = [
    {
      prNumber: 1,
      prTitle: 'Add user authentication flow',
      description: 'Implements OAuth2 login with Google and GitHub providers. This change adds secure authentication to protect user data and enable personalized features.\n\n## Changes\n- Added NextAuth.js configuration\n- Created login/logout pages\n- Added session management\n\n## Testing\n- Tested locally with both providers\n- Verified session persistence',
      prState: 'MERGED' as const,
      status: 'COMPLETE' as const,
      evidenceScore: 85,
      prAuthor: 'nagasatyadheerajanumala',
      ticketLinks: ['https://linear.app/alltime/issue/AT-123'],
      prBaseBranch: 'main',
      prHeadBranch: 'feature/auth',
      prMergedAt: new Date('2026-01-15'),
    },
    {
      prNumber: 2,
      prTitle: 'Fix payment processing race condition',
      description: 'Resolves race condition in payment webhook handler that caused duplicate charges.\n\n## Root Cause\nWebhook handler was not idempotent, leading to duplicate processing when Stripe retried failed webhooks.\n\n## Fix\n- Added idempotency key tracking\n- Implemented database-level locking',
      prState: 'MERGED' as const,
      status: 'COMPLETE' as const,
      evidenceScore: 78,
      prAuthor: 'nagasatyadheerajanumala',
      ticketLinks: ['https://linear.app/alltime/issue/AT-456'],
      prBaseBranch: 'main',
      prHeadBranch: 'fix/payment-race',
      prMergedAt: new Date('2026-01-20'),
    },
    {
      prNumber: 3,
      prTitle: 'Update database schema for multi-tenancy',
      description: 'Adds organization_id column to all tables to support multi-tenant architecture.',
      prState: 'OPEN' as const,
      status: 'NEEDS_REVIEW' as const,
      evidenceScore: 45,
      prAuthor: 'nagasatyadheerajanumala',
      ticketLinks: [],
      prBaseBranch: 'main',
      prHeadBranch: 'feature/multi-tenancy',
      prMergedAt: null,
    },
    {
      prNumber: 4,
      prTitle: 'Add compliance dashboard components',
      description: 'Creates new dashboard components for displaying compliance status across frameworks.\n\n## Components Added\n- ComplianceStatusCard\n- FrameworkSelector\n- ControlChecklist\n\nRelated to SOC 2 Type II preparation.',
      prState: 'OPEN' as const,
      status: 'PENDING' as const,
      evidenceScore: 62,
      prAuthor: 'nagasatyadheerajanumala',
      ticketLinks: ['https://linear.app/alltime/issue/AT-789'],
      prBaseBranch: 'main',
      prHeadBranch: 'feature/compliance-dashboard',
      prMergedAt: null,
    },
  ];

  for (const der of sampleDERs) {
    const record = await prisma.decisionEvidenceRecord.upsert({
      where: {
        repositoryId_prNumber: {
          repositoryId: repo.id,
          prNumber: der.prNumber,
        },
      },
      update: {
        evidenceScore: der.evidenceScore,
        status: der.status,
        prState: der.prState,
      },
      create: {
        organizationId: ALLTIME_ORG_ID,
        repositoryId: repo.id,
        prNumber: der.prNumber,
        prTitle: der.prTitle,
        description: der.description,
        prUrl: `https://github.com/nagasatyadheerajanumala/AllTime/pull/${der.prNumber}`,
        prAuthor: der.prAuthor,
        prState: der.prState,
        status: der.status,
        evidenceScore: der.evidenceScore,
        ticketLinks: der.ticketLinks,
        slackThreads: [],
        prBaseBranch: der.prBaseBranch,
        prHeadBranch: der.prHeadBranch,
        prMergedAt: der.prMergedAt,
        aiMissingContext: der.evidenceScore < 60 ? ['Missing detailed description', 'No ticket reference'] : [],
        aiSuggestions: der.evidenceScore < 70 ? ['Add more context about the change', 'Link to related ticket'] : [],
      },
    });
    console.log(`✓ DER #${der.prNumber}: ${record.prTitle.slice(0, 40)}...`);
  }

  // Create some gaps for the low-score DERs
  const lowScoreDERs = await prisma.decisionEvidenceRecord.findMany({
    where: {
      organizationId: ALLTIME_ORG_ID,
      evidenceScore: { lt: 60 },
    },
  });

  for (const der of lowScoreDERs) {
    await prisma.evidenceGap.createMany({
      data: [
        {
          derId: der.id,
          type: 'INSUFFICIENT_CONTEXT',
          message: 'PR description lacks sufficient detail about the change',
          severity: 'HIGH',
          resolved: false,
        },
        {
          derId: der.id,
          type: 'MISSING_TICKET',
          message: 'No ticket or issue link found in PR',
          severity: 'MEDIUM',
          resolved: false,
        },
      ],
      skipDuplicates: true,
    });
    console.log(`✓ Added gaps for DER #${der.prNumber}`);
  }

  // Create PR reviews for merged PRs
  const mergedDERs = await prisma.decisionEvidenceRecord.findMany({
    where: {
      organizationId: ALLTIME_ORG_ID,
      prState: 'MERGED',
    },
  });

  for (const der of mergedDERs) {
    await prisma.pRReview.upsert({
      where: {
        derId_githubId: {
          derId: der.id,
          githubId: 1000000 + der.prNumber,
        },
      },
      update: {},
      create: {
        derId: der.id,
        githubId: 1000000 + der.prNumber,
        author: 'reviewer-bot',
        state: 'APPROVED',
        body: 'LGTM! Changes look good.',
        submittedAt: new Date(),
      },
    });
    console.log(`✓ Added review for DER #${der.prNumber}`);
  }

  console.log('\n✅ Demo data seeded successfully!');

  // Verify
  const stats = await prisma.decisionEvidenceRecord.groupBy({
    by: ['status'],
    where: { organizationId: ALLTIME_ORG_ID },
    _count: true,
  });

  console.log('\n=== Summary ===');
  console.log('DERs by status:');
  stats.forEach(s => console.log(`  ${s.status}: ${s._count}`));

  const totalDERs = await prisma.decisionEvidenceRecord.count({
    where: { organizationId: ALLTIME_ORG_ID },
  });
  console.log(`\nTotal DERs: ${totalDERs}`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
