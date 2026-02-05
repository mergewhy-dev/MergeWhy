# MergeWhy

Decision Evidence System for SOC 2/SOX Compliance.

When auditors ask "why did you make this change?" - MergeWhy has the answer.

## Overview

MergeWhy captures decision-making evidence at merge time for engineering teams. It documents **what changed**, **why it changed**, and **compliance status** for every pull request.

**Target Market**: Fintech/healthcare companies needing SOC 2/SOX compliance.

## Features

- **Automatic Evidence Collection**: Captures PR descriptions, ticket links, code reviews, and Slack context
- **Evidence Scoring**: Calculates a 0-100 score based on documentation completeness
- **Gap Detection**: Identifies missing documentation (no description, no ticket, no review, etc.)
- **AI Documentation Analysis**: Analyzes documentation quality, intent alignment, and audit readiness
- **GitHub Check Integration**: Posts pass/fail status directly to pull requests
- **Audit Trail**: Immutable evidence snapshots when PRs are merged

## AI Documentation Analysis

MergeWhy uses AI to analyze pull request documentation for audit readiness. Unlike security scanners (GitGuardian, etc.), MergeWhy focuses on **decision evidence** - helping auditors understand WHY changes were made.

### What It Analyzes

| Metric | Values | Description |
|--------|--------|-------------|
| **Documentation Quality** | Complete / Partial / Insufficient | Is the purpose of this change clearly documented? |
| **Intent Alignment** | Aligned / Unclear / Misaligned | Do the code changes match the stated purpose? |
| **Audit Readiness** | Ready / Needs Work / Not Ready | Is there sufficient context for an auditor? |

### Missing Context Detection

The AI identifies what's missing for complete documentation:
- No explanation of WHY the change is needed
- No ticket or issue reference
- Description doesn't match scope of changes
- Insufficient context for someone unfamiliar with the code

## GitHub Check Integration

MergeWhy posts a Check Run to every pull request showing:

| Status | Meaning |
|--------|---------|
| **Pass** | Evidence score >= 60, no critical gaps, audit ready |
| **Neutral** | Evidence score >= 40, some gaps but no critical issues |
| **Fail** | Evidence score < 40, critical gaps, or not audit ready |

### Setting Up Branch Protection

To require the MergeWhy check before merging, configure branch protection rules:

#### Step 1: Navigate to Branch Protection Settings

1. Go to your repository on GitHub
2. Click **Settings** > **Branches**
3. Under "Branch protection rules", click **Add rule** (or edit an existing rule)

#### Step 2: Configure the Protection Rule

1. In **Branch name pattern**, enter your protected branch (e.g., `main` or `master`)
2. Check **Require status checks to pass before merging**
3. In the search box, search for **"MergeWhy Evidence"**
4. Select it to add as a required check

#### Step 3: Additional Recommended Settings

For maximum compliance coverage, also enable:

- **Require a pull request before merging** - Ensures all changes go through PRs
- **Require approvals** - Set to at least 1 reviewer
- **Dismiss stale pull request approvals when new commits are pushed** - Ensures reviews are current
- **Require conversation resolution before merging** - All feedback must be addressed

#### Step 4: Save

Click **Create** or **Save changes** to apply the rule.

### What the Check Shows

When you open a PR, the MergeWhy Evidence check will appear in the status checks section:

**Passing Check:**
```
MergeWhy Evidence - Documentation Complete - Score: 75/100
```

**Failing Check:**
```
MergeWhy Evidence - Documentation Required - Score: 25/100
```

Click "Details" to see:
- What's good (for passing checks)
- What's missing (documentation gaps to address)
- Documentation status table
- Link to full evidence report

### How to Improve Your Score

| Action | Points | Why It Matters |
|--------|--------|----------------|
| Add detailed PR description explaining what and why | +25 | Auditors need to understand purpose |
| Link a ticket (Jira, Linear, GitHub Issue) | +25 | Connects change to business requirement |
| Get a code review | +15 | Shows peer oversight |
| Get an approval | +20 | Documents authorization |
| Add Slack context | +10 | Additional discussion trail |

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk (organizations + users)
- **API**: tRPC (type-safe)
- **Monorepo**: Turborepo + pnpm

## Project Structure

```
mergewhy/
├── apps/
│   └── web/                    # Next.js app
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   ├── components/     # React components
│       │   ├── lib/            # Utilities
│       │   └── server/         # tRPC routers
├── packages/
│   ├── database/               # Prisma schema + client
│   ├── ui/                     # Shared components
│   └── config-*/               # Shared configs
└── turbo.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# GitHub App
GITHUB_APP_ID="..."
GITHUB_PRIVATE_KEY="..."
GITHUB_WEBHOOK_SECRET="..."

# AI (Anthropic)
ANTHROPIC_API_KEY="sk-ant-..."

# App URL
NEXT_PUBLIC_APP_URL="https://your-app.com"
```

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm build            # Build all packages
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
```

## License

Proprietary - All rights reserved.
