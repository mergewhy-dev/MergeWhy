# Command: Setup tRPC API

Copy this entire prompt into Claude Code to set up tRPC:

---

Set up tRPC API layer for MergeWhy. Follow these steps:

## Step 1: Install dependencies
```bash
cd apps/web
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query superjson zod
```

## Step 2: Create tRPC context and router setup

Create apps/web/src/server/trpc.ts:
```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@clerk/nextjs/server';
import superjson from 'superjson';
import { prisma } from '@mergewhy/database';

export const createTRPCContext = async () => {
  const { userId, orgId } = await auth();
  return { prisma, userId, orgId };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const orgProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.orgId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Organization required' });
  }
  return next({ ctx: { ...ctx, orgId: ctx.orgId } });
});
```

## Step 3: Create DER router

Create apps/web/src/server/routers/der.ts:
```typescript
import { z } from 'zod';
import { router, orgProcedure } from '../trpc';

export const derRouter = router({
  list: orgProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'NEEDS_REVIEW', 'CONFIRMED', 'COMPLETE', 'INCOMPLETE']).optional(),
      repositoryId: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const records = await ctx.prisma.decisionEvidenceRecord.findMany({
        where: {
          organizationId: ctx.orgId,
          ...(input.status && { status: input.status }),
          ...(input.repositoryId && { repositoryId: input.repositoryId }),
        },
        include: {
          repository: true,
          gaps: true,
          _count: { select: { reviews: true, comments: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (records.length > input.limit) {
        const nextItem = records.pop();
        nextCursor = nextItem?.id;
      }

      return { records, nextCursor };
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.decisionEvidenceRecord.findFirst({
        where: { id: input.id, organizationId: ctx.orgId },
        include: {
          repository: true,
          evidenceItems: true,
          gaps: true,
          reviews: true,
          comments: true,
          confirmations: { include: { user: true } },
        },
      });
    }),

  confirm: orgProcedure
    .input(z.object({ derId: z.string(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { clerkUserId: ctx.userId, organizationId: ctx.orgId },
      });
      if (!user) throw new Error('User not found');

      return ctx.prisma.evidenceConfirmation.create({
        data: { derId: input.derId, userId: user.id, note: input.note },
      });
    }),

  getStats: orgProcedure.query(async ({ ctx }) => {
    const [total, pending, needsReview, avgScore] = await Promise.all([
      ctx.prisma.decisionEvidenceRecord.count({ where: { organizationId: ctx.orgId } }),
      ctx.prisma.decisionEvidenceRecord.count({ where: { organizationId: ctx.orgId, status: 'PENDING' } }),
      ctx.prisma.decisionEvidenceRecord.count({ where: { organizationId: ctx.orgId, status: 'NEEDS_REVIEW' } }),
      ctx.prisma.decisionEvidenceRecord.aggregate({
        where: { organizationId: ctx.orgId },
        _avg: { evidenceScore: true },
      }),
    ]);

    return { total, pending, needsReview, avgScore: avgScore._avg.evidenceScore || 0 };
  }),
});
```

## Step 4: Create repository router

Create apps/web/src/server/routers/repository.ts with:
- list - Get all repos for org
- getById - Get single repo with stats

## Step 5: Create settings router

Create apps/web/src/server/routers/settings.ts with:
- get - Get org settings
- update - Update org settings

## Step 6: Create app router

Create apps/web/src/server/routers/_app.ts:
```typescript
import { router } from '../trpc';
import { derRouter } from './der';
import { repositoryRouter } from './repository';
import { settingsRouter } from './settings';

export const appRouter = router({
  der: derRouter,
  repository: repositoryRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
```

## Step 7: Create API route

Create apps/web/src/app/api/trpc/[trpc]/route.ts:
```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createTRPCContext } from '@/server/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

## Step 8: Create client provider

Create apps/web/src/lib/trpc.ts with React Query setup and TRPCProvider component.

Update apps/web/src/app/layout.tsx to include TRPCProvider.

## Step 9: Create hooks

Create apps/web/src/hooks/use-ders.ts:
```typescript
import { trpc } from '@/lib/trpc';

export function useDERs(filters?: { status?: string; repositoryId?: string }) {
  return trpc.der.list.useInfiniteQuery(
    { ...filters },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
}

export function useDER(id: string) {
  return trpc.der.getById.useQuery({ id });
}

export function useConfirmDER() {
  const utils = trpc.useUtils();
  return trpc.der.confirm.useMutation({
    onSuccess: () => {
      utils.der.list.invalidate();
      utils.der.getById.invalidate();
    },
  });
}

export function useDERStats() {
  return trpc.der.getStats.useQuery();
}
```

## Step 10: Connect to UI

Update dashboard pages to use the tRPC hooks instead of mock data.

## Step 11: Test

1. Run `pnpm dev`
2. Open browser devtools Network tab
3. Navigate through app
4. Verify tRPC calls are being made
5. Check data is loading correctly

## Step 12: Commit
```bash
git add .
git commit -m "feat: add tRPC API layer"
```

After completion, update claude-progress.txt.
