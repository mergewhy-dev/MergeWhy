import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/webhooks/github',
  '/api/webhooks/clerk',
  '/pricing',
  '/about',
  '/blog',
  '/contact',
  '/docs(.*)',
  '/privacy',
  '/terms',
  '/security',
  '/changelog',
  '/roadmap',
  '/careers',
  '/case-studies',
]);

// Routes that should completely bypass Clerk middleware
const isWebhookRoute = (request: NextRequest) => {
  const path = request.nextUrl.pathname;
  return path.startsWith('/api/webhooks');
};

export default clerkMiddleware(async (auth, request) => {
  // Completely skip auth for webhook routes - don't even call auth()
  if (isWebhookRoute(request)) {
    return NextResponse.next();
  }

  // For public routes, allow access without auth
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  const { userId } = await auth();
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
