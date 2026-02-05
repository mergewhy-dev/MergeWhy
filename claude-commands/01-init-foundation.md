# Command: Initialize Foundation

Copy this entire prompt into Claude Code to set up the monorepo:

---

Initialize the MergeWhy monorepo. Execute these steps in order:

## Step 1: Create Directory Structure
```bash
mkdir -p apps/web packages/database packages/ui packages/config-typescript packages/config-eslint
```

## Step 2: Create root package.json
```json
{
  "name": "mergewhy",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "db:generate": "turbo run db:generate",
    "db:push": "turbo run db:push",
    "db:studio": "pnpm --filter @mergewhy/database db:studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

## Step 3: Create pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## Step 4: Create turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "db:generate": { "cache": false },
    "db:push": { "cache": false }
  }
}
```

## Step 5: Initialize Next.js in apps/web
```bash
cd apps/web
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

## Step 6: Add shadcn/ui to apps/web
```bash
cd apps/web
pnpm dlx shadcn-ui@latest init
# Choose: Style=New York, Color=Slate, CSS variables=Yes

pnpm dlx shadcn-ui@latest add button card badge input label table tabs dialog dropdown-menu separator skeleton toast
```

## Step 7: Create database package

Create packages/database/package.json:
```json
{
  "name": "@mergewhy/database",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

Copy schema.prisma to packages/database/prisma/schema.prisma

Create packages/database/src/index.ts:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
```

## Step 8: Create .gitignore
```
node_modules
.next
dist
.env
.env.local
.env*.local
*.log
.turbo
```

## Step 9: Install and verify
```bash
pnpm install
pnpm db:generate
pnpm build
```

## Step 10: Commit
```bash
git add .
git commit -m "feat: initialize monorepo with Next.js, Prisma, shadcn/ui"
```

After completion, update claude-progress.txt to mark step 1 complete.
