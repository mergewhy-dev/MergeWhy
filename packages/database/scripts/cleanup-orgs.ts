import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  // Check current state
  const orgs = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          repositories: true,
          decisionRecords: true,
          users: true,
          frameworks: true,
          evidenceVaults: true,
          gitHubInstallations: true,
        }
      }
    }
  });

  console.log('Current organizations:\n');
  orgs.forEach(org => {
    const hasData = org._count.repositories > 0 || org._count.decisionRecords > 0;
    console.log(`${hasData ? '✓' : '✗'} ${org.name} (${org.id.slice(0,12)}...)`);
    console.log(`  clerkOrgId: ${org.clerkOrgId}`);
    console.log(`  repos: ${org._count.repositories}, DERs: ${org._count.decisionRecords}, users: ${org._count.users}`);
    console.log('');
  });

  // Find orgs with data vs empty
  const orgsWithData = orgs.filter(o => o._count.repositories > 0 || o._count.decisionRecords > 0);
  const emptyOrgs = orgs.filter(o => o._count.repositories === 0 && o._count.decisionRecords === 0);

  console.log(`\nOrgs with data: ${orgsWithData.length}`);
  console.log(`Empty orgs: ${emptyOrgs.length}`);

  if (emptyOrgs.length === 0) {
    console.log('\nNo empty orgs to delete.');
    return;
  }

  // Delete empty organizations
  console.log('\nDeleting empty organizations...\n');

  for (const org of emptyOrgs) {
    try {
      // First delete related records that might exist
      await prisma.organizationSettings.deleteMany({
        where: { organizationId: org.id }
      });

      await prisma.evidenceVault.deleteMany({
        where: { organizationId: org.id }
      });

      await prisma.user.deleteMany({
        where: { organizationId: org.id }
      });

      await prisma.gitHubInstallation.deleteMany({
        where: { organizationId: org.id }
      });

      // Now delete the org
      await prisma.organization.delete({
        where: { id: org.id }
      });

      console.log(`  Deleted: ${org.name} (${org.clerkOrgId})`);
    } catch (err) {
      console.log(`  Failed to delete ${org.name}: ${err}`);
    }
  }

  // Final state
  const remaining = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          repositories: true,
          decisionRecords: true,
        }
      }
    }
  });

  console.log('\n=== Final State ===\n');
  remaining.forEach(org => {
    console.log(`✓ ${org.name}: ${org._count.repositories} repos, ${org._count.decisionRecords} DERs`);
    console.log(`  clerkOrgId: ${org.clerkOrgId}`);
  });

  console.log('\nCleanup complete!');
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
