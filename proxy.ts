import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/billing(.*)",
  "/choose-usage(.*)",
  "/dashboard(.*)",
  "/home(.*)",
  "/onboarding(.*)",
  "/settings(.*)",
  "/strategy(.*)",
  "/team(.*)",
  "/api/admin(.*)",
  "/api/billing(.*)",
  "/api/onboarding(.*)",
  "/api/strategies(.*)",
  "/api/teams(.*)",
]);

const clerkProxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) await auth.protect();
});

export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkProxy
  : function unconfiguredProxy(_request: NextRequest) { void _request; return NextResponse.next(); };

export const config = { matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)", "/__clerk/:path*"] };
