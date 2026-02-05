# Command: Setup GitHub Integration

Copy this entire prompt into Claude Code to set up GitHub webhooks:

---

Set up GitHub App integration for MergeWhy. Follow these steps:

## Step 1: Create GitHub App (Manual Step)

Go to https://github.com/settings/apps/new and configure:

**Basic Info:**
- Name: MergeWhy (or your-org-mergewhy)
- Homepage URL: http://localhost:3000
- Callback URL: http://localhost:3000/api/github/callback
- Webhook URL: http://localhost:3000/api/webhooks/github (use ngrok for local dev)
- Webhook secret: Generate a secure random string

**Permissions:**
- Repository > Contents: Read
- Repository > Pull requests: Read & Write
- Repository > Checks: Read & Write
- Repository > Issues: Read
- Repository > Metadata: Read

**Events:**
- Pull request
- Pull request review
- Pull request review comment
- Check run
- Check suite

After creation, note:
- App ID
- Generate and download private key
- Generate Client Secret

## Step 2: Install dependencies
```bash
cd apps/web
pnpm add @octokit/webhooks @octokit/auth-app @octokit/rest
```

## Step 3: Add environment variables

Add to apps/web/.env.local:
```
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

## Step 4: Create GitHub utilities

Create apps/web/src/lib/github.ts:
```typescript
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';

export function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
  });
}

export async function getInstallationOctokit(installationId: number) {
  const appOctokit = getAppOctokit();
  const { token } = await appOctokit.auth({
    type: 'installation',
    installationId,
  }) as { token: string };

  return new Octokit({ auth: token });
}
```

## Step 5: Create evidence extractor

Create apps/web/src/lib/evidence-extractor.ts:
```typescript
// Jira ticket patterns
const JIRA_PATTERN = /\b([A-Z][A-Z0-9]+-\d+)\b/g;
const JIRA_URL_PATTERN = /https?:\/\/[^\/]+\.atlassian\.net\/browse\/([A-Z][A-Z0-9]+-\d+)/g;

// Linear ticket patterns
const LINEAR_PATTERN = /\b([A-Z]+-\d+)\b/g;
const LINEAR_URL_PATTERN = /https?:\/\/linear\.app\/[^\/]+\/issue\/([A-Z]+-\d+)/g;

// GitHub issue patterns
const GITHUB_ISSUE_PATTERN = /#(\d+)/g;
const GITHUB_ISSUE_URL_PATTERN = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/g;

// Slack thread patterns
const SLACK_PATTERN = /https?:\/\/[a-z0-9-]+\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/g;

export function extractTicketLinks(text: string): string[] {
  const tickets = new Set<string>();
  
  // Extract Jira
  let match;
  while ((match = JIRA_PATTERN.exec(text)) !== null) {
    tickets.add(match[1]);
  }
  while ((match = JIRA_URL_PATTERN.exec(text)) !== null) {
    tickets.add(match[1]);
  }
  
  // Extract Linear
  while ((match = LINEAR_PATTERN.exec(text)) !== null) {
    tickets.add(match[1]);
  }
  while ((match = LINEAR_URL_PATTERN.exec(text)) !== null) {
    tickets.add(match[1]);
  }
  
  return Array.from(tickets);
}

export function extractSlackLinks(text: string): string[] {
  const matches = text.match(SLACK_PATTERN) || [];
  return [...new Set(matches)];
}

export function extractGitHubIssues(text: string, repoFullName: string): string[] {
  const issues = new Set<string>();
  
  let match;
  while ((match = GITHUB_ISSUE_PATTERN.exec(text)) !== null) {
    issues.add(`https://github.com/${repoFullName}/issues/${match[1]}`);
  }
  while ((match = GITHUB_ISSUE_URL_PATTERN.exec(text)) !== null) {
    issues.add(`https://github.com/${match[1]}/${match[2]}/issues/${match[3]}`);
  }
  
  return Array.from(issues);
}
```

## Step 6: Create evidence score calculator

Create apps/web/src/lib/evidence-score.ts:
```typescript
interface ScoreInput {
  hasDescription: boolean;
  descriptionLength: number;
  ticketCount: number;
  reviewCount: number;
  approvedReviewCount: number;
  hasSlackContext: boolean;
}

export function calculateEvidenceScore(input: ScoreInput): number {
  let score = 0;
  
  // Description (0-25 points)
  if (input.hasDescription) {
    score += 10;
    if (input.descriptionLength > 100) score += 5;
    if (input.descriptionLength > 300) score += 5;
    if (input.descriptionLength > 500) score += 5;
  }
  
  // Ticket links (0-25 points)
  if (input.ticketCount > 0) {
    score += 15;
    score += Math.min(input.ticketCount - 1, 2) * 5;
  }
  
  // Reviews (0-30 points)
  if (input.reviewCount > 0) {
    score += 10;
    score += Math.min(input.reviewCount, 2) * 5;
    score += Math.min(input.approvedReviewCount, 2) * 5;
  }
  
  // Slack context (0-10 points)
  if (input.hasSlackContext) {
    score += 10;
  }
  
  // Bonus for having everything (0-10 points)
  if (input.hasDescription && input.ticketCount > 0 && input.approvedReviewCount > 0) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

export function detectGaps(input: ScoreInput, settings: { requireDescription: boolean; requireTicketLink: boolean; minReviewers: number }) {
  const gaps: Array<{ type: string; severity: string; message: string; suggestion: string }> = [];
  
  if (settings.requireDescription && !input.hasDescription) {
    gaps.push({
      type: 'MISSING_DESCRIPTION',
      severity: 'HIGH',
      message: 'PR description is empty',
      suggestion: 'Add a description explaining what this change does and why',
    });
  }
  
  if (settings.requireTicketLink && input.ticketCount === 0) {
    gaps.push({
      type: 'MISSING_TICKET',
      severity: 'MEDIUM',
      message: 'No ticket or issue linked',
      suggestion: 'Link a Jira ticket, Linear issue, or GitHub issue',
    });
  }
  
  if (input.approvedReviewCount < settings.minReviewers) {
    gaps.push({
      type: 'MISSING_APPROVAL',
      severity: 'HIGH',
      message: `Needs ${settings.minReviewers - input.approvedReviewCount} more approval(s)`,
      suggestion: 'Request review from team members',
    });
  }
  
  return gaps;
}
```

## Step 7: Create webhook handler

Create apps/web/src/app/api/webhooks/github/route.ts:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Webhooks } from '@octokit/webhooks';
import { prisma } from '@mergewhy/database';
import { extractTicketLinks, extractSlackLinks } from '@/lib/evidence-extractor';
import { calculateEvidenceScore, detectGaps } from '@/lib/evidence-score';

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
});

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('x-hub-signature-256') ?? '';
  const event = request.headers.get('x-github-event') ?? '';

  try {
    // Verify signature
    const isValid = await webhooks.verify(payload, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(payload);

    // Handle different events
    switch (event) {
      case 'pull_request':
        await handlePullRequest(data);
        break;
      case 'pull_request_review':
        await handlePullRequestReview(data);
        break;
      case 'installation':
        await handleInstallation(data);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handlePullRequest(data: any) {
  const { action, pull_request, repository, installation } = data;
  
  // Find repository in our database
  const repo = await prisma.repository.findFirst({
    where: { githubId: repository.id },
    include: { organization: { include: { settings: true } } },
  });
  
  if (!repo) return;

  const ticketLinks = extractTicketLinks(pull_request.body || '');
  const slackThreads = extractSlackLinks(pull_request.body || '');

  if (action === 'opened' || action === 'reopened') {
    // Create new DER
    await prisma.decisionEvidenceRecord.create({
      data: {
        organizationId: repo.organizationId,
        repositoryId: repo.id,
        prNumber: pull_request.number,
        prTitle: pull_request.title,
        prUrl: pull_request.html_url,
        prAuthor: pull_request.user.login,
        prAuthorAvatar: pull_request.user.avatar_url,
        prState: 'OPEN',
        prBaseBranch: pull_request.base.ref,
        prHeadBranch: pull_request.head.ref,
        description: pull_request.body,
        ticketLinks,
        slackThreads,
        evidenceScore: calculateEvidenceScore({
          hasDescription: !!pull_request.body,
          descriptionLength: pull_request.body?.length || 0,
          ticketCount: ticketLinks.length,
          reviewCount: 0,
          approvedReviewCount: 0,
          hasSlackContext: slackThreads.length > 0,
        }),
        status: 'PENDING',
      },
    });
  } else if (action === 'edited') {
    // Update existing DER
    await prisma.decisionEvidenceRecord.updateMany({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
      data: {
        prTitle: pull_request.title,
        description: pull_request.body,
        ticketLinks,
        slackThreads,
      },
    });
  } else if (action === 'closed') {
    // Mark DER as complete or incomplete
    const der = await prisma.decisionEvidenceRecord.findFirst({
      where: { repositoryId: repo.id, prNumber: pull_request.number },
      include: { gaps: true },
    });
    
    if (der) {
      await prisma.decisionEvidenceRecord.update({
        where: { id: der.id },
        data: {
          prState: pull_request.merged ? 'MERGED' : 'CLOSED',
          prMergedAt: pull_request.merged_at,
          status: der.gaps.filter(g => !g.resolved).length > 0 ? 'INCOMPLETE' : 'COMPLETE',
        },
      });
    }
  }
}

async function handlePullRequestReview(data: any) {
  const { action, review, pull_request, repository } = data;
  
  if (action !== 'submitted') return;
  
  const repo = await prisma.repository.findFirst({
    where: { githubId: repository.id },
  });
  
  if (!repo) return;
  
  const der = await prisma.decisionEvidenceRecord.findFirst({
    where: { repositoryId: repo.id, prNumber: pull_request.number },
  });
  
  if (!der) return;
  
  await prisma.pRReview.upsert({
    where: { derId_githubId: { derId: der.id, githubId: review.id } },
    create: {
      derId: der.id,
      githubId: review.id,
      author: review.user.login,
      state: review.state.toUpperCase(),
      body: review.body,
      submittedAt: new Date(review.submitted_at),
    },
    update: {
      state: review.state.toUpperCase(),
      body: review.body,
    },
  });
  
  // Recalculate evidence score
  const reviews = await prisma.pRReview.findMany({ where: { derId: der.id } });
  const approvedCount = reviews.filter(r => r.state === 'APPROVED').length;
  
  await prisma.decisionEvidenceRecord.update({
    where: { id: der.id },
    data: {
      evidenceScore: calculateEvidenceScore({
        hasDescription: !!der.description,
        descriptionLength: der.description?.length || 0,
        ticketCount: der.ticketLinks.length,
        reviewCount: reviews.length,
        approvedReviewCount: approvedCount,
        hasSlackContext: der.slackThreads.length > 0,
      }),
    },
  });
}

async function handleInstallation(data: any) {
  const { action, installation, repositories } = data;
  
  if (action === 'created') {
    // Store installation - you'll need to link this to an org
    console.log('New installation:', installation.id);
  }
}
```

## Step 8: Test with ngrok

1. Install ngrok: `brew install ngrok`
2. Run ngrok: `ngrok http 3000`
3. Update GitHub App webhook URL with ngrok URL
4. Create a test PR
5. Check logs for webhook receipt

## Step 9: Commit
```bash
git add .
git commit -m "feat: add GitHub App integration"
```

After completion, update claude-progress.txt.
