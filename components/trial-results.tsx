"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatCurrency, formatUsdInCurrency, type SupportedCurrency } from "@/lib/currency";
import type { CandidateScore, StepRecommendation, StrategyPlan, SubscriptionSummary } from "@/lib/recommendation/types";

type TrialResult = { usageType: "one_off" | "monthly"; plans: StrategyPlan[] };
type SelectedTool = CandidateScore["tools"][number];
type TrialResultsProps = {
  result: TrialResult;
  saveControl?: ReactNode;
  savedStrategyId?: string;
  mode?: "trial" | "saved";
  beforeFooter?: ReactNode;
};

function currency(plan: StrategyPlan): SupportedCurrency {
  return plan.inputsUsed?.budgetOriginalCurrency === "VND" || plan.inputsUsed?.budgetOriginalCurrency === "AUD" ? plan.inputsUsed.budgetOriginalCurrency : "USD";
}

function money(value: number, plan: StrategyPlan) {
  return formatUsdInCurrency(value, currency(plan));
}

function budgetCap(plan: StrategyPlan) {
  if (plan.inputsUsed?.budgetOriginalAmount !== null && plan.inputsUsed?.budgetOriginalAmount !== undefined) {
    return formatCurrency(plan.inputsUsed.budgetOriginalAmount, currency(plan));
  }
  return plan.budgetUsd === null || plan.budgetUsd === undefined ? "No cap" : money(plan.budgetUsd, plan);
}

function roleFor(category: string) {
  if (category.includes("image") || category.includes("video") || category.includes("design")) return "VISUAL AI";
  if (category.includes("coding") || category.includes("development")) return "CODING AI";
  if (category.includes("research") || category.includes("analysis")) return "RESEARCH AI";
  if (category.includes("writing") || category.includes("text")) return "WRITING AI";
  if (category.includes("audio") || category.includes("speech")) return "AUDIO AI";
  return "SPECIALIST AI";
}

function subscriptionFor(tool: SelectedTool, plan: StrategyPlan): SubscriptionSummary | undefined {
  return plan.subscriptions.find((item) => item.modelNames.includes(tool.model.name));
}

function accessName(tool: SelectedTool) {
  return tool.access.productName ?? tool.model.provider;
}

function actionFor(tool: SelectedTool, plan: StrategyPlan) {
  const subscription = subscriptionFor(tool, plan);
  if (subscription?.alreadyOwned) return "KEEP";
  return tool.access.accessMethod === "product" ? "ADD" : "USE";
}

function costFor(tool: SelectedTool, plan: StrategyPlan) {
  const subscription = subscriptionFor(tool, plan);
  if (subscription?.alreadyOwned) return "Already in your setup";
  if (tool.access.accessMethod === "product") {
    return subscription?.priceUsd == null ? "Check current plan price" : `${money(subscription.priceUsd, plan)} / month`;
  }
  return `${money(tool.estimatedCostUsd, plan)} estimated usage`;
}

function ResultSummary({ plan, monthly }: { plan: StrategyPlan; monthly: boolean }) {
  const savings = plan.estimatedSavingsUsd;
  return (
    <section className="trial-result-hero" aria-labelledby="result-title">
      <div><h1 id="result-title">Estimated cost</h1></div>
      <div className="trial-result-summary-cost"><strong>{money(plan.totalCostUsd, plan)}{monthly ? " / month" : ""}</strong>{savings > 0 && <span>{money(savings, plan)} potential saving</span>}</div>
    </section>
  );
}

function StepToolCard({ step, tool, plan }: { step: StepRecommendation; tool: SelectedTool; plan: StrategyPlan }) {
  const action = actionFor(tool, plan);
  const route = accessName(tool);
  const explanation = step.selected?.explanation.find((item) => item.trim()) ?? `Selected to complete ${step.step.name}.`;
  return (
    <article className="trial-tool-card">
      <div className="trial-tool-card-top"><span>{roleFor(step.taskCategory)}</span></div>
      <div className="trial-model-identity"><h3>{tool.model.name}</h3><p>by {tool.model.provider}{route.toLowerCase() !== tool.model.provider.toLowerCase() ? <> · access via <strong>{route}</strong></> : null}</p></div>
      <div className="trial-job-label"><small>USE THIS AI FOR</small><strong>{step.step.name}</strong><span>{step.step.plainLanguageDescription}</span></div>
            <div className="trial-tool-meta"><strong>{costFor(tool, plan)}</strong><a href={tool.access.url} target="_blank" rel="noreferrer">Open {route} <ArrowUpRight /></a></div>
      <details className="trial-why"><summary>Why this model? <ChevronDown /></summary><div><p>{step.selected?.explanation.join(" ")}</p><ul><li>Specific model: {tool.model.name}</li><li>Access route: {route}</li><li>Covers: {tool.coversCapabilities.join(", ") || step.taskCategory.replaceAll("_", " ")}</li><li>Estimated usage: {money(tool.estimatedCostUsd, plan)}</li></ul></div></details>
    </article>
  );
}

function UnmatchedStepCard({ step, plan }: { step: StepRecommendation; plan: StrategyPlan }) {
  const partial = step.partialOptions[0];
  const tool = partial?.tools[0];
  const route = tool ? accessName(tool) : null;
  return (
    <article className="trial-tool-card trial-tool-card-unmatched">
      <div className="trial-tool-card-top"><span>{roleFor(step.taskCategory)}</span></div>
      <div className="trial-model-identity"><h3>{tool?.model.name ?? "No complete model match yet"}</h3>{tool && <p>by {tool.model.provider}{route && route.toLowerCase() !== tool.model.provider.toLowerCase() ? <> · access via <strong>{route}</strong></> : null}</p>}</div>
      <div className="trial-job-label"><small>JOB STILL TO COVER</small><strong>{step.step.name}</strong><span>{step.step.plainLanguageDescription}</span></div>
      {tool && <div className="trial-tool-meta"><strong>{money(tool.estimatedCostUsd, plan)} estimated usage</strong><a href={tool.access.url} target="_blank" rel="noreferrer">Open {route} <ArrowUpRight /></a></div>}
      <details className="trial-why">
        <summary>See what is missing <ChevronDown /></summary>
        <div>
          <p>{partial ? `Partial candidate only: ${partial.model.name} covers ${partial.coveredCapabilities.join(", ") || "part of the requirement"}, but cannot yet be presented as a complete answer.` : "No current model passed every evidence and access check."}</p>
          <p>{partial?.missingCapabilities.length ? `Missing capabilities: ${partial.missingCapabilities.join(", ")}` : "A fully verified capability, price, privacy, or access path."}</p>
        </div>
      </details>
    </article>
  );
}

function NoAiStepCard({ step }: { step: StepRecommendation }) {
  return <article className="trial-tool-card trial-tool-card-no-ai"><div className="trial-tool-card-top"><span>NO AI REQUIRED</span></div><h3>{step.step.name}</h3></article>;
}

export function TrialResults({ result, saveControl, savedStrategyId, mode = "trial", beforeFooter }: TrialResultsProps) {
  const plan = result.plans[0];
  const monthly = result.usageType === "monthly";
  const complete = plan.completeStepCount === plan.steps.length;
  return (
    <div className="trial-results-content">
      <ResultSummary plan={plan} monthly={monthly} />

      <div className="trial-section-divider" />
      <section id="ai-team" className="trial-results-section"><div className="trial-section-heading"><h2>Recommended AI Workflow</h2></div>
        <div className="trial-tools-grid">
          {plan.steps.flatMap((step) => step.selected?.tools.map((tool) => <StepToolCard key={`${step.stepId}:${tool.model.id}`} step={step} tool={tool} plan={plan} />) ?? (step.step.noAIEligible ? [<NoAiStepCard key={step.stepId} step={step} />] : [<UnmatchedStepCard key={step.stepId} step={step} plan={plan} />]))}
        </div>
        {complete && plan.existingSubscriptions.couldCancel.length > 0 && <div className="trial-cancel-list"><span>REVIEW POSSIBLE OVERLAP</span>{plan.existingSubscriptions.couldCancel.map((tool) => <strong key={tool}>{tool} <small>Check usage before cancelling</small></strong>)}</div>}
      </section>

      {beforeFooter && (
        <>
          <div className="trial-section-divider" />
          {beforeFooter}
        </>
      )}

      <div className="trial-section-divider" />
      {mode === "saved" ? saveControl : savedStrategyId ? <Link className="trial-primary-button" href={`/strategy/${savedStrategyId}/results`}>View saved strategy</Link> : saveControl}
    </div>
  );
}
