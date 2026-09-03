"use client";

import { ArrowUpRight, Check, DatabaseZap, History, PencilLine, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiErrorMessage } from "@/lib/client/api-error";
import { formatUsdInCurrency, type SupportedCurrency } from "@/lib/currency";
import { candidateId, customizeStrategyPlan } from "@/lib/recommendation/customize";
import type { CandidateScore, StepRecommendation, StrategyPlan } from "@/lib/recommendation/types";
import { IntegrationNotice } from "./integration-notice";
import { LoadingCounter } from "./loading-counter";
import { integrationsConfigured } from "./providers";
import { TrialResults } from "./trial-results";

type SnapshotSource = { source: string; sourceUrl?: string; attribution?: string; fetchedAt: number; sourceVersion?: string };
type Result = {
  locked: boolean;
  usageType: "one_off" | "monthly";
  estimatedCompletionTime?: string;
  plans: StrategyPlan[];
  dataSnapshot: { fetchedAt: number; sources?: SnapshotSource[] };
};

const optionLabels: Array<[keyof StepRecommendation["options"], string]> = [
  ["bestFit", "Best fit"],
  ["budget", "Best value"],
  ["premium", "Higher quality"],
  ["fastest", "Fastest"],
  ["privacy", "Privacy focused"],
];

function currency(plan: StrategyPlan): SupportedCurrency {
  return plan.inputsUsed?.budgetOriginalCurrency === "VND" || plan.inputsUsed?.budgetOriginalCurrency === "AUD"
    ? plan.inputsUsed.budgetOriginalCurrency
    : "USD";
}

function money(value: number, plan: StrategyPlan) {
  return formatUsdInCurrency(value, currency(plan));
}

function accessRoute(candidate: CandidateScore) {
  const tool = candidate.tools[0];
  return tool?.access.productName ?? tool?.model.provider ?? candidate.model.provider;
}

function candidatesFor(step: StepRecommendation) {
  const entries = [
    ...optionLabels.map(([key, label]) => ({ label, candidate: step.options[key] })),
    ...step.alternatives.map((candidate, index) => ({ label: `Alternative ${index + 1}`, candidate })),
    ...step.partialOptions.map((candidate, index) => ({ label: `Partial ${index + 1}`, candidate })),
  ].filter((entry): entry is { label: string; candidate: CandidateScore } => Boolean(entry.candidate));

  return entries.filter((entry, index, all) =>
    all.findIndex((other) => candidateId(other.candidate) === candidateId(entry.candidate)) === index,
  );
}

function ModelCustomizer({
  plan,
  selections,
  busy,
  message,
  onSelect,
  onReset,
  onSave,
}: {
  plan: StrategyPlan;
  selections: Record<string, string>;
  busy: boolean;
  message: string;
  onSelect(stepId: string, candidate: CandidateScore): void;
  onReset(): void;
  onSave(): void;
}) {
  const changed = Object.keys(selections).length > 0;

  return (
    <section className="trial-results-section" aria-labelledby="customize-models-title">
      <div className="trial-section-heading">
        <h2 id="customize-models-title">Alternative Options</h2>
      </div>

      <div className="trial-customize-steps">
        {plan.steps.map((step) => {
          const choices = candidatesFor(step);
          if (!choices.length) return null;
          return (
            <article className="trial-customize-step" key={step.stepId}>
              <div className="trial-customize-job"><small>JOB</small><strong>{step.step.name}</strong></div>
              <div className="trial-choice-grid">
                {choices.map(({ label, candidate }) => {
                  const selected = Boolean(selections[step.stepId] === candidateId(candidate));
                  const route = accessRoute(candidate);
                  return (
                    <button type="button" className="trial-model-choice" data-selected={selected} onClick={() => onSelect(step.stepId, candidate)} key={candidateId(candidate)}>
                      <div className="trial-model-choice-inner">
                        <span>{label}</span>
                        <strong>{candidate.model.name}</strong>
                        <small>by {candidate.model.provider}{route.toLowerCase() !== candidate.model.provider.toLowerCase() ? ` · via ${route}` : ""}</small>
                        <b>{money(candidate.estimatedCostUsd, plan)} {selected && <Check aria-hidden="true" />}</b>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <div className="trial-customize-actions">
        <p role="status">{message || (changed ? "Preview updated. Save when this stack looks right." : "Your saved choices are currently shown.")}</p>
        {changed && <div><button type="button" className="trial-secondary-button" onClick={onReset}><RotateCcw /> Reset</button><button type="button" className="trial-primary-button" disabled={busy} onClick={onSave}><Save /> {busy ? "Saving…" : "Save changes"}</button></div>}
      </div>
    </section>
  );
}

export function ResultsView({ strategyId }: { strategyId: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [customSelections, setCustomSelections] = useState<Record<string, string>>({});
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!integrationsConfigured) return;
    const cached = sessionStorage.getItem(`benchflow:result:${strategyId}`);
    let request: Promise<Result>;
    if (cached) {
      sessionStorage.removeItem(`benchflow:result:${strategyId}`);
      try { request = Promise.resolve(JSON.parse(cached) as Result); }
      catch { request = fetchResult(); }
    } else request = fetchResult();

    request.then(setResult).catch((reason) => setError(reason instanceof Error ? reason.message : "Results unavailable"));

    function fetchResult() {
      return fetch(`/api/strategies/${strategyId}/results`).then(async (response) => {
        const body = (await response.json()) as Result | { code?: string; userMessage?: string; error?: string };
        if (!response.ok) throw new Error(apiErrorMessage(body, "We couldn't load recommendations right now."));
        return body as Result;
      });
    }
  }, [strategyId]);

  async function saveCustomization() {
    const selections = Object.entries(customSelections).map(([stepId, selectedCandidateId]) => ({ stepId, candidateId: selectedCandidateId }));
    if (!selections.length) return;
    setSaveBusy(true);
    setSaveMessage("");
    try {
      const response = await fetch(`/api/strategies/${strategyId}/results`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selections }),
      });
      const body = await response.json() as StrategyPlan | { code?: string; userMessage?: string; error?: string };
      if (!response.ok || !("steps" in body)) throw new Error(apiErrorMessage(body, "We couldn't save this custom stack."));
      setResult((current) => current ? { ...current, plans: current.plans.map((item) => item.variant === "recommended" ? body : item) } : current);
      setCustomSelections({});
      setSaveMessage("Changes saved to consultation history.");
    } catch (reason) {
      setSaveMessage(reason instanceof Error ? reason.message : "Unable to save custom stack");
    } finally {
      setSaveBusy(false);
    }
  }

  if (!integrationsConfigured) return <IntegrationNotice />;
  if (error) return <div className="trial-results-state"><DatabaseZap /><h2>Strategy temporarily unavailable</h2><p>{error}. Your previous consultation is still safe.</p></div>;
  if (!result) return <div className="trial-processing" aria-live="polite"><LoadingCounter label="Matching your saved AI stack…" /></div>;

  const basePlan = result.plans.find((item) => item.variant === "recommended") ?? result.plans[0];
  const plan = customizeStrategyPlan(basePlan, customSelections);
  const customizer = (
    <ModelCustomizer
      plan={plan}
      selections={customSelections}
      busy={saveBusy}
      message={saveMessage}
      onSelect={(stepId, candidate) => { setCustomSelections((current) => ({ ...current, [stepId]: candidateId(candidate) })); setSaveMessage(""); }}
      onReset={() => { setCustomSelections({}); setSaveMessage(""); }}
      onSave={saveCustomization}
    />
  );
  const isMonthly = result.usageType === "monthly";
  const savedActions = (
    <div className="trial-saved-actions">
      <Link className="signed-home-history" href="/dashboard#consultation-history">
        <History aria-hidden="true" /> View previous consultations <ArrowUpRight aria-hidden="true" />
      </Link>
      {!isMonthly && <Link className="trial-primary-button" href={`/strategy/${strategyId}/workflow`}>Edit workflow <PencilLine /></Link>}
    </div>
  );

  return <TrialResults result={{ usageType: result.usageType, plans: [plan] }} mode="saved" beforeFooter={customizer} saveControl={savedActions} />;
}
