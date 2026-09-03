"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { Menu, X, ArrowUpRight, Presentation, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "./brand";
import { authConfigured } from "./providers";
import { VisualModeToggle } from "./visual-mode-toggle";

function AuthActions() {
  if (!authConfigured) {
    return (
      <>
        <Link href="/sign-in" className="nav-link-subtle">Log in</Link>
        <Link className="btn-primary text-xs px-4 py-2" href="/sign-up">
          <span>Build Strategy</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <Link href="/sign-in" className="nav-link-subtle">Log in</Link>
        <Link className="btn-primary text-xs px-4 py-2" href="/sign-up">
          <span>Build Strategy</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href="/home" className="btn-primary text-xs px-4 py-2">
          <LayoutDashboard className="w-3.5 h-3.5 text-black mr-1" />
          <span>Workspace</span>
        </Link>
        <UserButton userProfileMode="navigation" userProfileUrl="/settings" />
      </Show>
    </>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />

        {/* Mode Switcher Quick Links */}
        <nav className={`header-nav ${open ? "open" : ""}`}>
          <Link href="/" className="inline-flex items-center gap-1">
            <Presentation className="w-3.5 h-3.5 text-indigo-400" />
            <span>Presentation</span>
          </Link>
          <Link href="/choose-usage" className="inline-flex items-center gap-1">
            <LayoutDashboard className="w-3.5 h-3.5 text-pink-400" />
            <span>Mode Switcher</span>
          </Link>
          <Link href="/pricing">Pricing</Link>
          <AuthActions />
          <div className="flex items-center pl-2 border-l border-white/10">
            <VisualModeToggle />
          </div>
        </nav>

        <button
          className="mobile-menu-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
