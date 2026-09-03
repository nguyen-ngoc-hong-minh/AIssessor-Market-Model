"use client";

import { ArrowUpRight, Copy, History, Plus, Trash2, RefreshCw, Repeat2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IntegrationNotice } from "./integration-notice";
import { integrationsConfigured } from "./providers";
import { formatCurrency, type SupportedCurrency } from "@/lib/currency";

type Strategy = {
  _id: string;
  title: string;
  usageType: "one_off" | "monthly";
  budget?: number;
  budgetAmount?: number;
  budgetCurrency?: SupportedCurrency;
  status: string;
  createdAt: number;
  refreshAvailable?: boolean;
  refreshReasons?: string[];
};

export function DashboardView() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/strategies")
      .then(async (response) => {
        const body = (await response.json()) as Strategy[] | { error?: string };
        if (!response.ok) throw new Error("error" in body ? body.error : "Unable to load strategies");
        return body as Strategy[];
      })
      .then(setStrategies)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load strategies"));
  }

  useEffect(() => {
    if (integrationsConfigured) load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this strategy?")) return;
    await fetch(`/api/strategies/${id}`, { method: "DELETE" });
    load();
  }

  async function duplicate(id: string) {
    const response = await fetch(`/api/strategies/${id}/duplicate`, { method: "POST" });
    if (!response.ok) {
      setError("Unable to duplicate strategy");
      return;
    }
    load();
  }

  if (!integrationsConfigured) return <IntegrationNotice />;
  const savedPlans = strategies.filter((strategy) => strategy.status === "complete").length;

  return (
    <div className="editorial-dashboard-wrap dashboard-page-stack">
      <div className="dashboard-create-bar glass-card">
        <div>
          
          <h1>What are you working on?</h1>
          
        </div>
        <div className="dashboard-create-actions !flex-row">
          <Link className="btn-primary" href="/strategy/new/one-off"><Plus aria-hidden="true" /> One-off project <ArrowUpRight aria-hidden="true" /></Link>
          <Link className="btn-primary" href="/strategy/new/monthly"><Repeat2 aria-hidden="true" /> Monthly workflow <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="dash-metrics-grid grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric glass-card p-6 pb-4 flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs text-indigo-soft tracking-wider mb-2 font-medium">Active projects</div>
            <div className="metric-num text-5xl font-bold tracking-tight my-4 text-ink">{strategies.length}</div>
            <p className="metric-lbl text-xs text-ink-2 leading-relaxed mt-2">Total project and monthly task evaluations</p>
          </div>
        </div>

        <div className="metric glass-card p-6 pb-4 flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs text-indigo-soft tracking-wider mb-2 font-medium">Optimized stack</div>
            <div className="metric-num text-5xl font-bold tracking-tight my-4 text-ink">{savedPlans}</div>
            <p className="metric-lbl text-xs text-ink-2 leading-relaxed mt-2">Plans ready for deployment &amp; execution</p>
          </div>
        </div>

        <div className="metric glass-card p-6 pb-4 flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs text-indigo-soft tracking-wider mb-2 font-medium">New better option</div>
            <div className="metric-num text-5xl font-bold tracking-tight my-4 text-ink">
              &minus;32%
            </div>
            <p className="metric-lbl text-xs text-ink-2 leading-relaxed mt-2">Gemini Flash X benchmark for research workflow</p>
          </div>
        </div>
      </div>

      {/* Main Strategy List Section */}
      <div id="consultation-history" className="dash-content-block min-h-[485px] flex flex-col gap-6 scroll-mt-24">
        <div>
          

          <div className="flex items-end justify-between gap-4">
            <h2 className="h-display text-3xl md:text-4xl font-semibold text-ink">
              Previous Consultations
            </h2>
            
          </div>

          {error && <p className="text-red-400 text-sm mb-6">{error}</p>}
        </div>

        {strategies.length === 0 ? (
          <div className="flex-1 flex flex-col justify-between py-6">
            <div className="flex-1 flex items-center justify-center my-auto py-10">
              <p className="body-md text-sm md:text-base text-ink-2 text-center">
                No Saved Strategies Yet
              </p>
            </div>
            <div className="flex justify-center w-full pt-4">
              <Link className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-sm" href="/home">
                <Plus className="w-4 h-4" />
                <span>Create Your First Strategy</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="dashboard-strategy-list flex flex-col gap-6">
            {strategies.map((strategy, idx) => (
              <div className="problem-card flex items-start gap-6 p-6 md:p-8" key={strategy._id}>
                <div className="font-mono text-xs text-indigo-soft mt-1">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                  <h3 className="font-sans text-base font-bold text-ink">
                    {strategy.title}
                  </h3>

                  <div className="flex flex-col gap-3 font-mono text-[11px] text-ink-3">
                    <span>[{strategy.usageType === "one_off" ? "ONE-OFF PROJECT" : "MONTHLY WORKFLOW"}]</span>
                    <span>Created: {new Date(strategy.createdAt).toLocaleDateString()}</span>
                    <span>
                      {strategy.usageType === "one_off"
                        ? strategy.budgetAmount === undefined && strategy.budget === undefined
                          ? "Budget not set"
                          : `Budget: ${strategy.budgetAmount !== undefined && strategy.budgetCurrency ? formatCurrency(strategy.budgetAmount, strategy.budgetCurrency) : formatCurrency(strategy.budget ?? 0, "USD")}`
                        : "Recurring Workload"}
                    </span>
                  </div>

                  <div className="flex items-center self-start gap-3">
                    <Link
                      className="dash-view-plan-btn"
                      href={`/strategy/${strategy._id}/${strategy.status === "complete" ? "results" : "workflow"}`}
                      title="Open strategy"
                    >
                      <span>View plan</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      className="dash-action-btn"
                      onClick={() => duplicate(strategy._id)}
                      title="Duplicate strategy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      className="dash-action-btn"
                      onClick={() => remove(strategy._id)}
                      title="Delete strategy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
