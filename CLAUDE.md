# MergeWhy - Decision Evidence System

## Project Overview

MergeWhy captures decision-making evidence at merge time for engineering teams. It documents **what changed**, **why it changed**, and **compliance status**.

**Target Market**: Fintech/healthcare companies needing SOC 2/SOX compliance.
**Value Prop**: When auditors ask "why did you make this change?" - MergeWhy has the answer.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode, no `any`)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Clerk (organizations + users)
- **API**: tRPC (type-safe)
- **Monorepo**: Turborepo + pnpm

---

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
├── CLAUDE.md                   # This file
├── claude-progress.txt         # Progress tracking
└── turbo.json
```

---

## Core Domain: Decision Evidence Record (DER)

One DER per Pull Request containing:
- PR metadata (title, author, branches)
- Extracted evidence (description, ticket links, Slack threads)
- Evidence score (0-100)
- Gaps (missing description, no ticket, etc.)
- Confirmations from team members

---

## Coding Standards

### TypeScript
- `strict: true`, no `any` types
- Prefer `interface` over `type` for objects
- Always type function params and returns

### React/Next.js
- Server Components by default
- `"use client"` only when needed
- Use `loading.tsx` and `error.tsx`

### Prisma
- Always filter by `organizationId` (multi-tenant)
- Use transactions for multi-table ops
- Use `select` to limit fields

---

## Commands

```bash
pnpm install          # Install deps
pnpm dev              # Start dev server
pnpm build            # Build all
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to DB
pnpm db:studio        # Open Prisma Studio
```

---

## Current Phase: MVP Foundation

See `claude-progress.txt` for current status and next tasks.

---

## Important Constraints

1. No broad Slack scraping - only linked threads
2. Immutable evidence snapshots on PR merge
3. All queries must filter by organizationId
4. Respect GitHub API rate limits (5000/hour)
