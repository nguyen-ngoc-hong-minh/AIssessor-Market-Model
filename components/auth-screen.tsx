"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { Brand } from "./brand";
import { authConfigured } from "./providers";
import { VisualModeToggle } from "./visual-mode-toggle";

function AuthConfigurationNotice() {
  return (
    <div className="minimal-notice">
      <KeyRound className="w-6 h-6 text-[#0213B0] flex-none" />
      <div>
        <strong className="notice-title">Authentication Key Required</strong>
        <p className="notice-desc">
          Add Clerk environment keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) to enable live user authentication.
        </p>
      </div>
    </div>
  );
}

export function AuthScreen({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignIn = mode === "sign-in";
  return (
    <div className="auth-page-clean">
      {/* Top Fixed Header with Brand, Theme Toggle and Back to Home */}
      <header className="trial-header">
        <Brand />
        <div className="flex items-center gap-3">
          <VisualModeToggle />
          <Link href="/" className="trial-header-auth-btn">
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Clean Centered Auth Container with Vanilla Clerk Component */}
      <main className="auth-clean-container">
        {!authConfigured ? (
          <AuthConfigurationNotice />
        ) : isSignIn ? (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/home"
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/home"
          />
        )}
      </main>
    </div>
  );
}
