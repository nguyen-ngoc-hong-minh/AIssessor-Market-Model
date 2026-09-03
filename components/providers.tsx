"use client";

import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { resolveConvexUrl } from "@/lib/convex-deployment";

const convexUrl = resolveConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL);
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convex = new ConvexReactClient(convexUrl);

export const authConfigured = Boolean(clerkKey);
export const integrationsConfigured = Boolean(clerkKey);

export function Providers({ children }: { children: React.ReactNode }) {
  if (!clerkKey) return children;

  return <ClerkProvider publishableKey={clerkKey} signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/">
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>{children}</ConvexProviderWithClerk>
  </ClerkProvider>;
}
