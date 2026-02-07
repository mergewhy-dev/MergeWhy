import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CHRONA_ID = 'cml83funp0000nqwbly64ced9';
const ALLTIME_ID = 'cml83gttx0006nqwbkp8ga1vb';

async function main() {
  console.log('Moving data from Chrona to AllTime...\n');

  // Show before state
  const beforeRepos = await prisma.repository.count({ where: { organizationId: CHRONA_ID } });
  const beforeDers = await prisma.decisionEvidenceRecord.count({ where: { organizationId: CHRONA_ID } });
  console.log(`Before: Chrona has ${beforeRepos} repos, ${beforeDers} DERs`);

  // Move repositories
  const repoResult = await prisma.repository.updateMany({
    where: { organizationId: CHRONA_ID },
    data: { organizationId: ALLTIME_ID },
  });
  console.log(`Moved ${repoResult.count} repositories`);

  // Move DERs
  const derResult = await prisma.decisionEvidenceRecord.updateMany({
    where: { organizationId: CHRONA_ID },
    data: { organizationId: ALLTIME_ID },
  });
  console.log(`Moved ${derResult.count} DERs`);

  // Move any related evidence vaults
  const vaultResult = await prisma.evidenceVault.updateMany({
    where: { organizationId: CHRONA_ID },
    data: { organizationId: ALLTIME_ID },
  });
  console.log(`Moved ${vaultResult.count} evidence vaults`);

  // Verify
  const repos = await prisma.repository.count({ where: { organizationId: ALLTIME_ID } });
  const ders = await prisma.decisionEvidenceRecord.count({ where: { organizationId: ALLTIME_ID } });

  console.log(`\nAfter: AllTime now has ${repos} repos, ${ders} DERs`);
  console.log('\nData migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
