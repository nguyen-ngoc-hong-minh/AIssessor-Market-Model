"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IntegrationNotice } from "./integration-notice";
import { OptionalDetails, defaultOptionalDetails } from "./optional-details";
import { PriorityRanking, defaultPriorityRanking } from "./priority-picker";
import { integrationsConfigured } from "./providers";
import { apiErrorMessage } from "@/lib/client/api-error";
import { BriefSuggestions } from "./brief-suggestions";

export function OneOffStrategyForm() {
  const router = useRouter();
  const [todayValue] = useState(() => new Date().toISOString().slice(0, 10));
  const [brief, setBrief] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budgetChoice, setBudgetChoice] = useState("100");
  const [customBudget, setCustomBudget] = useState("");
  const [currency, setCurrency] = useState<"USD" | "AUD" | "VND">("USD");
  const [priorities, setPriorities] = useState(defaultPriorityRanking);
  const [optionalDetails, setOptionalDetails] = useState(defaultOptionalDetails);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const amount = Number(budgetChoice === "custom" ? customBudget : budgetChoice);
    if (brief.trim().length < 20) return setError("Tell us a little more about the result you need.");
    if (!deadline || deadline < todayValue) return setError("Choose today or a future completion date.");
    if (!Number.isFinite(amount) || amount < 0) return setError("Enter a valid budget amount.");

    setBusy(true);
    try {
      const payload = {
        usageType: "one_off",
        projectBrief: brief.trim(),
        deadline,
        budgetAmount: amount,
        budgetCurrency: currency,
        priorities,
        existingTools: optionalDetails.existingTools.split(",").map((item) => item.trim()).filter(Boolean),
        optionalContext: {
          informationSensitivity: optionalDetails.informationSensitivity,
          commercialUse: optionalDetails.commercialUse,
          providersToAvoid: optionalDetails.providersToAvoid.split(",").map((item) => item.trim()).filter(Boolean),
          preferredLanguage: optionalDetails.preferredLanguage,
          expectedOutputs: optionalDetails.expectedOutputs,
        },
      };
      const response = await fetch("/api/strategies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { strategyId?: string; code?: string; userMessage?: string; error?: string };
      if (!response.ok || !body.strategyId) {
        throw new Error(apiErrorMessage(body, "We couldn't analyze your project right now. Please try again later."));
      }
      router.push(`/strategy/${body.strategyId}/workflow`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Planning failed");
    } finally {
      setBusy(false);
    }
  }

  if (!integrationsConfigured) return <IntegrationNotice />;

  return (
    <form className="space-y-8" onSubmit={submit}>
      {/* Section 1: Project Brief */}
      <section className="settings-faint-block">
        <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
          Project Brief
        </h2>
        <div>
          <label htmlFor="project-brief" className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider">
            Tell us what you’re working on
          </label>
          <textarea
            id="project-brief"
            className="styled-textarea text-base p-5 min-h-[160px] rounded-3xl w-full"
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            placeholder="Describe what you want to accomplish... (e.g. Launch a new skincare brand: market research, brand positioning, campaign visuals, and web app build)"
          />
          <BriefSuggestions
            brief={brief}
            onApply={(text) => setBrief((current) => `${current.trim()}\n\n${text}`.trim())}
          />
        </div>
      </section>

      {/* Section 2: Project Parameters */}
      <section className="settings-faint-block">
        <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
          Project Parameters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label htmlFor="deadline" className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              className="styled-input pill-input py-3.5"
              min={todayValue}
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="currency" className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider">
              Currency
            </label>
            <select
              id="currency"
              className="styled-select pill-input py-3.5 rounded-full"
              value={currency}
              onChange={(event) => {
                const newCurr = event.target.value as typeof currency;
                setCurrency(newCurr);
                if (newCurr === "VND" && (budgetChoice === "50" || budgetChoice === "100" || budgetChoice === "500")) {
                  setBudgetChoice("100000");
                } else if ((newCurr === "USD" || newCurr === "AUD") && (budgetChoice === "50000" || budgetChoice === "100000" || budgetChoice === "500000")) {
                  setBudgetChoice("100");
                }
              }}
            >
              <option value="USD">USD ($)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="VND">VND (₫)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider">
              Budget Amount
            </label>
            <div className="budget-pills-row flex flex-wrap gap-3">
              {(currency === "VND" ? [50000, 100000, 500000] : [50, 100, 500]).map((amount) => {
                const label = currency === "VND"
                  ? `${amount.toLocaleString("vi-VN")}`
                  : `${currency === "USD" ? "$" : "A$"}${amount}`;
                return (
                  <button
                    type="button"
                    className={`budget-pill rounded-full ${budgetChoice === String(amount) ? "selected-pill" : ""}`}
                    onClick={() => setBudgetChoice(String(amount))}
                    key={amount}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                className={`budget-pill rounded-full ${budgetChoice === "custom" ? "selected-pill" : ""}`}
                onClick={() => setBudgetChoice("custom")}
              >
                Enter exact budget
              </button>
            </div>
            {budgetChoice === "custom" && (
              <>
                <div className="h-[10px]" />
                <input
                  aria-label="Exact budget"
                  type="number"
                  className="styled-input pill-input py-3.5 w-full"
                  min="0"
                  step="any"
                  value={customBudget}
                  onChange={(event) => setCustomBudget(event.target.value)}
                  placeholder="Enter budget amount"
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Priority Ranking */}
      <section className="settings-faint-block">
        <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
          Priority Ranking
        </h2>
        <PriorityRanking priorities={priorities} onChange={setPriorities} />
      </section>

      {/* Section 4: Project Parameters */}
      <section className="settings-faint-block">
        <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
          Project Parameters
        </h2>
        <OptionalDetails idPrefix="one-off" value={optionalDetails} onChange={setOptionalDetails} />
      </section>

      {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

      {/* Spacer Div */}
      <div className="h-[30px] w-full block" style={{ height: "30px", minHeight: "30px" }} />

      {/* Form Actions Footer */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button className="btn-primary text-xs px-8 py-3 rounded-full shadow-lg shadow-indigo-600/30" disabled={busy}>
          <span>{busy ? "ANALYZING PROJECT..." : "Build Strategy →"}</span>
        </button>
      </div>
    </form>
  );
}
