import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const frameworks = [
  {
    name: "SOC 2 Type II",
    shortCode: "soc2",
    description:
      "Service Organization Control 2 - Trust Services Criteria for security, availability, and confidentiality",
    icon: "🛡️",
    controls: [
      {
        controlId: "CC6.1",
        name: "Logical Access Security",
        description:
          "The entity implements logical access security software, infrastructure, and architectures to protect information assets.",
        category: "Security",
        requiresApproval: true,
        requiresReview: true,
        requiresTicketLink: false,
        requiresDescription: true,
        requiresRiskAssessment: false,
        minReviewers: 1,
      },
      {
        controlId: "CC7.1",
        name: "System Operations",
        description:
          "The entity monitors system capacity, manages vulnerabilities, and detects and responds to security events.",
        category: "Operations",
        requiresApproval: false,
        requiresReview: true,
        requiresTicketLink: false,
        requiresDescription: true,
        requiresRiskAssessment: false,
        minReviewers: 0,
      },
      {
        controlId: "CC8.1",
        name: "Change Management",
        description:
          "The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes.",
        category: "Change Management",
        requiresApproval: true,
        requiresReview: true,
        requiresTicketLink: true,
        requiresDescription: true,
        requiresRiskAssessment: false,
        minReviewers: 1,
      },
    ],
  },
  {
    name: "DORA",
    shortCode: "dora",
    description:
      "Digital Operational Resilience Act - EU regulation for financial sector ICT risk management",
    icon: "🇪🇺",
    controls: [
      {
        controlId: "Art.9(4)(e)",
        name: "ICT Change Management",
        description:
          "Documented policies and controls for ICT change management, including all changes recorded, tested, assessed, approved, implemented and verified.",
        category: "Operations",
        requiresApproval: true,
        requiresReview: true,
        requiresTicketLink: true,
        requiresDescription: true,
        requiresRiskAssessment: true,
        minReviewers: 1,
      },
      {
        controlId: "Art.9(4)(c)",
        name: "ICT Risk Assessment",
        description:
          "Risk assessment as integral part of change management with traceable paths from risk to requirement to control.",
        category: "Risk Management",
        requiresApproval: false,
        requiresReview: true,
        requiresTicketLink: false,
        requiresDescription: true,
        requiresRiskAssessment: true,
        minReviewers: 0,
      },
      {
        controlId: "Art.10",
        name: "Incident Reporting",
        description:
          "Detection and documentation of ICT-related incidents with clear audit trails.",
        category: "Incident Management",
        requiresApproval: false,
        requiresReview: false,
        requiresTicketLink: false,
        requiresDescription: true,
        requiresRiskAssessment: false,
        minReviewers: 0,
      },
    ],
  },
  {
    name: "ISO 27001:2022",
    shortCode: "iso27001",
    description:
      "International standard for Information Security Management Systems (ISMS)",
    icon: "🌐",
    controls: [
      {
        controlId: "A.8.32",
        name: "Change Management",
        description:
          "Changes to information processing facilities and systems shall be subject to change management procedures.",
        category: "Operations Security",
        requiresApproval: true,
        requiresReview: true,
        requiresTicketLink: false,
        requiresDescription: true,
        requiresRiskAssessment: false,
        minReviewers: 1,
      },
      {
        controlId: "A.8.25",
        name: "Secure Development Lifecycle",
        description:
          "Rules for secure development of software and systems shall be established and applied.",
        category: "Development Security",
        requiresApproval: false,
        requiresReview: true,
        requiresTicketLink: false,
        requiresDescription: true,
        requiresRiskAssessment: false,
        minReviewers: 1,
      },
      {
        controlId: "A.8.9",
        name: "Configuration Management",
        description:
          "Configurations of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.",
        category: "Configuration",
        requiresApproval: false,
        requiresReview: false,
        requiresTicketLink: true,
        requiresDescription: true,
        requiresRiskAssessment: false,
        minReviewers: 0,
      },
    ],
  },
];

async function seed() {
  console.log("Seeding compliance frameworks...\n");

  for (const fw of frameworks) {
    const framework = await prisma.complianceFramework.upsert({
      where: { shortCode: fw.shortCode },
      update: {
        name: fw.name,
        description: fw.description,
        icon: fw.icon,
      },
      create: {
        name: fw.name,
        shortCode: fw.shortCode,
        description: fw.description,
        icon: fw.icon,
      },
    });

    console.log(`Framework: ${fw.name} (${framework.id})`);

    for (const ctrl of fw.controls) {
      await prisma.complianceControl.upsert({
        where: {
          frameworkId_controlId: {
            frameworkId: framework.id,
            controlId: ctrl.controlId,
          },
        },
        update: {
          name: ctrl.name,
          description: ctrl.description,
          category: ctrl.category,
          requiresApproval: ctrl.requiresApproval,
          requiresReview: ctrl.requiresReview,
          requiresTicketLink: ctrl.requiresTicketLink,
          requiresDescription: ctrl.requiresDescription,
          requiresRiskAssessment: ctrl.requiresRiskAssessment,
          minReviewers: ctrl.minReviewers,
        },
        create: {
          frameworkId: framework.id,
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
        },
      });
      console.log(`  - Control: ${ctrl.controlId} - ${ctrl.name}`);
    }
    console.log();
  }

  console.log("Seeding complete!");
}

seed()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
