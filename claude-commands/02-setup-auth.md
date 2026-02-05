# Command: Setup Authentication

Copy this entire prompt into Claude Code to set up Clerk auth:

---

Set up Clerk authentication for MergeWhy. Follow these steps:

## Prerequisites
Make sure you have:
- Clerk account at clerk.com
- Application created in Clerk dashboard
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY ready

## Step 1: Install Clerk
```bash
cd apps/web
pnpm add @clerk/nextjs
```

## Step 2: Create middleware

Create apps/web/src/middleware.ts:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## Step 3: Update root layout

Update apps/web/src/app/layout.tsx to wrap with ClerkProvider:
```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## Step 4: Create auth pages

Create apps/web/src/app/(auth)/layout.tsx:
```typescript
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
```

Create apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx:
```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return <SignIn />;
}
```

Create apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx:
```typescript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return <SignUp />;
}
```

## Step 5: Create dashboard layout

Create apps/web/src/app/(dashboard)/layout.tsx with:
- Sidebar navigation (Dashboard, Records, Repositories, Settings)
- Header with UserButton from Clerk
- Organization switcher if using Clerk Organizations

## Step 6: Create dashboard home page

Create apps/web/src/app/(dashboard)/page.tsx with a simple welcome message.

## Step 7: Update .env.local

Add these to apps/web/.env.local:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## Step 8: Test

1. Run `pnpm dev`
2. Visit http://localhost:3000
3. Should redirect to sign-in
4. Sign up a new user
5. Verify redirect to dashboard

## Step 9: Commit
```bash
git add .
git commit -m "feat: add Clerk authentication"
```

After completion, update claude-progress.txt.
