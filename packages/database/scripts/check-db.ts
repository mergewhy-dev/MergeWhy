import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('=== Organizations ===');
  const orgs = await prisma.organization.findMany();
  console.log(orgs);

  console.log('\n=== Repositories ===');
  const repos = await prisma.repository.findMany();
  console.log(repos);

  console.log('\n=== Decision Evidence Records ===');
  const ders = await prisma.decisionEvidenceRecord.findMany();
  console.log(ders);

  console.log('\n=== GitHub Installations ===');
  const installations = await prisma.gitHubInstallation.findMany();
  console.log(installations);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
