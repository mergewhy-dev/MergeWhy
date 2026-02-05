import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@mergewhy/database";

export const dynamic = "force-dynamic";

interface ClerkUserData {
  id: string;
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

interface ClerkOrganizationData {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface ClerkOrganizationMembershipData {
  id: string;
  organization: {
    id: string;
  };
  public_user_data: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    identifier: string;
  };
  role: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: unknown;
}

export async function POST(request: NextRequest) {
  console.log("[Clerk Webhook] Received request");

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the headers for verification
  const svix_id = request.headers.get("svix-id");
  const svix_timestamp = request.headers.get("svix-timestamp");
  const svix_signature = request.headers.get("svix-signature");

  console.log("[Clerk Webhook] Headers:", {
    "svix-id": svix_id ? "present" : "missing",
    "svix-timestamp": svix_timestamp ? "present" : "missing",
    "svix-signature": svix_signature ? "present" : "missing",
  });

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("[Clerk Webhook] Missing required svix headers");
    return NextResponse.json(
      { error: "Missing verification headers" },
      { status: 400 }
    );
  }

  const payload = await request.text();
  console.log("[Clerk Webhook] Payload length:", payload.length);

  // Verify the webhook signature
  const wh = new Webhook(webhookSecret);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
    console.log("[Clerk Webhook] Signature verified successfully");
  } catch (error) {
    console.error("[Clerk Webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log(`[Clerk Webhook] Event type: ${event.type}`);
  console.log("[Clerk Webhook] Event data:", JSON.stringify(event.data, null, 2));

  try {
    switch (event.type) {
      case "organization.created":
        console.log("[Clerk Webhook] Handling organization.created");
        await handleOrganizationCreated(event.data as ClerkOrganizationData);
        break;
      case "user.created":
        // Users are created when they join an organization via organizationMembership.created
        console.log(
          `[Clerk Webhook] User created in Clerk: ${(event.data as ClerkUserData).id} - will be linked on org membership`
        );
        break;
      case "organizationMembership.created":
        console.log("[Clerk Webhook] Handling organizationMembership.created");
        await handleOrganizationMembershipCreated(
          event.data as ClerkOrganizationMembershipData
        );
        break;
      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${event.type}`);
    }

    console.log("[Clerk Webhook] Successfully processed event");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Clerk Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleOrganizationCreated(data: ClerkOrganizationData) {
  const { id, name, slug } = data;

  console.log(`[Clerk Webhook] Creating organization: name=${name}, slug=${slug}, clerkOrgId=${id}`);

  // Create the organization
  const organization = await prisma.organization.upsert({
    where: { clerkOrgId: id },
    create: {
      name,
      slug,
      clerkOrgId: id,
    },
    update: {
      name,
      slug,
    },
  });

  console.log(`[Clerk Webhook] Organization upserted: id=${organization.id}`);

  // Create default organization settings
  const settings = await prisma.organizationSettings.upsert({
    where: { organizationId: organization.id },
    create: {
      organizationId: organization.id,
      requireDescription: true,
      requireTicketLink: true,
      minReviewers: 1,
      blockMergeOnGaps: false,
    },
    update: {},
  });

  console.log(`[Clerk Webhook] Organization settings created: id=${settings.id}`);
  console.log(`[Clerk Webhook] Organization created successfully: ${name} (clerkOrgId: ${id}, dbId: ${organization.id})`);
}

async function handleOrganizationMembershipCreated(
  data: ClerkOrganizationMembershipData
) {
  const { organization, public_user_data, role } = data;

  const clerkOrgId = organization.id;
  const clerkUserId = public_user_data.user_id;

  console.log(`[Clerk Webhook] Processing membership: clerkUserId=${clerkUserId}, clerkOrgId=${clerkOrgId}, role=${role}`);

  // Find or create the organization
  let org = await prisma.organization.findFirst({
    where: { clerkOrgId },
  });

  if (!org) {
    console.log(`[Clerk Webhook] Organization not found, creating: clerkOrgId=${clerkOrgId}`);
    // Organization might not exist yet if webhook arrived out of order
    const orgSlug = clerkOrgId.toLowerCase().replace(/[^a-z0-9]/g, "-");
    org = await prisma.organization.create({
      data: {
        name: orgSlug,
        slug: orgSlug,
        clerkOrgId,
      },
    });

    // Create default settings
    await prisma.organizationSettings.create({
      data: {
        organizationId: org.id,
        requireDescription: true,
        requireTicketLink: true,
        minReviewers: 1,
        blockMergeOnGaps: false,
      },
    });
    console.log(`[Clerk Webhook] Organization created: id=${org.id}`);
  } else {
    console.log(`[Clerk Webhook] Organization found: id=${org.id}, name=${org.name}`);
  }

  // Build user name from public data
  const userName =
    [public_user_data.first_name, public_user_data.last_name]
      .filter(Boolean)
      .join(" ") || public_user_data.identifier;

  console.log(`[Clerk Webhook] Creating/updating user: email=${public_user_data.identifier}, name=${userName}`);

  // Create or update the user
  const user = await prisma.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email: public_user_data.identifier,
      name: userName,
      avatarUrl: public_user_data.image_url,
      organizationId: org.id,
      role: role === "admin" ? "ADMIN" : "MEMBER",
    },
    update: {
      organizationId: org.id,
      role: role === "admin" ? "ADMIN" : "MEMBER",
    },
  });

  console.log(
    `[Clerk Webhook] User membership processed: userId=${user.id}, email=${public_user_data.identifier}, orgId=${org.id}, role=${role}`
  );
}
