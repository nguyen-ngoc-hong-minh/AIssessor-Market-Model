"use client";

import { Check, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { integrationsConfigured } from "@/components/providers";

const plans = [
  {
    name: "Free",
    price: "$0",
    text: "Evaluate one task before deciding whether to upgrade.",
    features: [
      "Account & onboarding setup",
      "One full task evaluation",
      "Editable workflow preview",
      "Limited recommendation summary",
    ],
  },
  {
    name: "Plus",
    price: "$19",
    text: "Complete strategies and alternatives for individual work.",
    features: [
      "Full AI strategy plans",
      "Unlimited saved strategies",
      "Multiple project strategies",
      "Monthly workflow recommendations",
      "Exportable reports",
    ],
    featured: true,
  },
  {
    name: "Team",
    price: "$49",
    text: "Shared planning for small teams and collaborators.",
    features: [
      "Everything in Plus",
      "Shared team workspace",
      "Multiple team members",
      "Collaborative strategy editing",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    text: "Organization access, dedicated support, and custom data controls.",
    features: [
      "Organization workspace",
      "Custom access controls",
      "Dedicated implementation support",
      "Contact sales team",
    ],
  },
];

export default function PricingPage() {
  async function checkout(plan: string) {
    if (!integrationsConfigured) return;
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: plan.toLowerCase() }),
    });
    const data = (await response.json()) as { url?: string };
    if (data.url) window.location.assign(data.url);
  }

  return (
    <div className="pricing-page-wrap">
      <SiteHeader />
      <main className="section pricing-main">
        <div className="pricing-header-block">
          <span className="mono-badge">[ PRICING PLAN ]</span>
          <h1>Transparent, simple pricing.</h1>
          <p>Pay for complete, verified recommendations — not fake success screens. Upgrade whenever you need deeper analysis.</p>
        </div>

        <div className="pricing-full-grid">
          {plans.map((plan) => (
            <article
              className={`pricing-full-card ${plan.featured ? "featured-card" : ""}`}
              key={plan.name}
            >
              {plan.featured && <span className="featured-badge">[ MOST POPULAR ]</span>}
              <small className="plan-name-lbl">{plan.name}</small>
              <h2>{plan.name}</h2>
              <div className="plan-price-num">
                {plan.price}
                {plan.price.startsWith("$") && <span> / month</span>}
              </div>
              <p className="plan-desc">{plan.text}</p>

              {plan.name === "Free" ? (
                <Link className="minimal-btn minimal-btn-outline full-width" href="/sign-up">
                  Start Free
                </Link>
              ) : plan.name === "Enterprise" ? (
                <a className="minimal-btn minimal-btn-outline full-width" href="mailto:sales@aissessor.app">
                  Contact Sales
                </a>
              ) : (
                <button
                  className="minimal-btn minimal-btn-dark full-width"
                  disabled={!integrationsConfigured}
                  onClick={() => checkout(plan.name)}
                >
                  {integrationsConfigured ? `Choose ${plan.name}` : "Configure Stripe to Continue"}
                </button>
              )}

              <ul className="plan-feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check className="w-4 h-4 text-black flex-none" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
