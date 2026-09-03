"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export function BillingView() {
  return (
    <div className="slide-inner s-compare w-full max-w-full">
      {/* Deck 6 style header layout */}
      <div className="s-compare-head">
        <div className="eyebrow mb-2">
          <span className="dt" />
          Simple pricing
        </div>
        <h2 className="h-display text-4xl md:text-5xl lg:text-6xl font-semibold">
          Affordable plans for every budget
        </h2>
        <p className="body-lg">
          Explore our range of pricing options designed to fit any budget, offering exceptional value and flexibility to meet your unique needs.
        </p>
      </div>

      {/* 3-Column Pricing Grid matching Slide 6 */}
      <div className="feature-grid grid grid-cols-1 md:grid-cols-3 gap-6 mt-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {/* Card 1: STARTER Plan */}
        <div className="feature glass-card pricing-deck-card flex flex-col justify-between p-8 relative overflow-visible pt-8 z-20">
          {/* Overlay Badge Top Right */}
          <div className="eyebrow absolute -top-3.5 right-6 z-[100] bg-[#131626] border border-indigo-400/50 shadow-md">
            <span className="dt" />
            <span>Current plan</span>
          </div>

          <div>
            <div className="plan-name mb-2 text-xl font-semibold text-ink">STARTER</div>
            <div className="plan-price-row flex items-baseline gap-1 my-4">
              <span className="plan-price text-4xl font-bold text-ink">$2.99</span>
              <span className="plan-period text-sm text-ink-2">/month</span>
            </div>
            <p className="plan-desc text-xs text-ink-2 leading-relaxed mb-6">
              3 AI Task Assessments / month &middot; Best for Creative Freelancers
            </p>

            <div className="plan-features-label font-mono text-xs text-indigo-soft uppercase tracking-wider mb-3">
              Features:
            </div>
            <ul className="plan-features-list space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>AI recommendation</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Cost estimate</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Save up to 3 strategies</span>
              </li>
            </ul>
          </div>

          <Link href="/dashboard" className="btn-secondary plan-cta-btn w-full text-center justify-center">
            Get Started
          </Link>
        </div>

        {/* Card 2: Featured OPTIMISE Plan (Recommended) */}
        <div className="feature glass-card pricing-deck-card bg-gradient-to-b from-[#151929] to-[#0c0f1c] border-2 border-indigo-500/60 shadow-2xl relative overflow-visible flex flex-col justify-between p-8 pt-8 z-20">
          {/* Overlay Badge Top Right */}
          <div className="eyebrow absolute -top-3.5 right-6 z-[100] bg-[#181a30] border border-indigo-400/60 shadow-md">
            <span className="dt" />
            <span>Recommended</span>
          </div>

          <div>
            <div className="plan-name mb-2 text-xl font-semibold text-ink">OPTIMISE</div>
            <div className="plan-price-row flex items-baseline gap-1 my-4">
              <span className="plan-price text-4xl font-bold text-ink">$9.99</span>
              <span className="plan-period text-sm text-ink-2">/month</span>
            </div>
            <p className="plan-desc text-xs text-ink-2 leading-relaxed mb-6">
              20 AI Task Assessments / month &middot; Best for Independent Professionals
            </p>

            <div className="plan-features-label font-mono text-xs text-indigo-soft uppercase tracking-wider mb-3">
              Features:
            </div>
            <ul className="plan-features-list space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-white font-medium">
                <span className="w-4 h-4 rounded-full bg-indigo-500 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span className="text-white font-medium">Full AI workflow</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Cost &amp; performance comparison</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Subscription optimisation</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Potential savings estimate</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Save up to 20 strategies</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-indigo-500 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Monthly AI recommendations</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className="btn-primary plan-cta-btn w-full text-center justify-center text-black bg-white hover:bg-indigo-100"
          >
            Get Started
          </button>
        </div>

        {/* Card 3: TEAM Plan */}
        <div className="feature glass-card pricing-deck-card flex flex-col justify-between p-8">
          <div>
            <div className="plan-name text-xl font-semibold text-ink mb-2">TEAM</div>
            <div className="plan-price-row flex items-baseline gap-1 my-4">
              <span className="plan-price text-4xl font-bold text-ink">Custom</span>
            </div>
            <p className="plan-desc text-xs text-ink-2 leading-relaxed mb-6">
              Custom AI Task Assessments &middot; Best for Growing Businesses
            </p>

            <div className="plan-features-label font-mono text-xs text-indigo-soft uppercase tracking-wider mb-3">
              Features:
            </div>
            <ul className="plan-features-list space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Full AI workflow</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Cost &amp; performance comparison</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Subscription optimisation</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Custom strategy storage</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Shared AI workspace</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Team cost tracking</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-ink-2">
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-none">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
                <span>Team recommendations</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className="btn-secondary plan-cta-btn w-full text-center justify-center"
          >
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}
