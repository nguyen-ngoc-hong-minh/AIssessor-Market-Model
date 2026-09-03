"use client";

import { ArrowLeft, ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IntegrationNotice } from "./integration-notice";
import { LoadingCounter } from "./loading-counter";
import { integrationsConfigured } from "./providers";
import { apiErrorMessage } from "@/lib/client/api-error";

type StoredStep = {
  _id: string;
  order: number;
  name: string;
  description: string;
  requirements: Record<string, unknown>;
  estimates: Record<string, unknown>;
};

type StrategyResponse = {
  strategy: { title: string; originalInput: string; status: string };
  steps: StoredStep[];
};

export function WorkflowEditor({ strategyId }: { strategyId: string }) {
  const router = useRouter();
  const [data, setData] = useState<StrategyResponse | null>(null);
  const [steps, setSteps] = useState<StoredStep[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!integrationsConfigured) return;
    fetch(`/api/strategies/${strategyId}`)
      .then(async (response) => {
        const body = (await response.json()) as StrategyResponse | { error?: string };
        if (!response.ok) throw new Error("error" in body ? body.error : "Unable to load workflow");
        return body as StrategyResponse;
      })
      .then((body) => {
        setData(body);
        setSteps(body.steps.sort((a, b) => a.order - b.order));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load workflow"));
  }, [strategyId]);

  function change(index: number, patch: Partial<StoredStep>) {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next.map((step, i) => ({ ...step, order: i })));
  }

  function add() {
    setSteps((current) => [
      ...current,
      {
        _id: `draft-${crypto.randomUUID()}`,
        order: current.length,
        name: "New step",
        description: "Describe what should happen in this step.",
        requirements: { requiredModalities: ["text"], requiredCapabilities: [], importance: "medium", noAIEligible: false },
        estimates: { requests: 1, inputExpected: 500, outputExpected: 300 },
      },
    ]);
  }

  function remove(index: number) {
    setSteps((current) => current.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i })));
  }

  async function save() {
    const response = await fetch(`/api/strategies/${strategyId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        steps: steps.map(({ order, name, description, requirements, estimates }) => ({
          order,
          name,
          description,
          requirements,
          estimates,
        })),
      }),
    });
    const body = (await response.json()) as { code?: string; userMessage?: string; error?: string };
    if (!response.ok) throw new Error(apiErrorMessage(body, "We couldn't save your workflow right now."));
  }

  async function handleSaveAndExit() {
    setBusy(true);
    setError("");
    try {
      await save();
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setBusy(true);
    setError("");
    try {
      await save();
      const response = await fetch(`/api/strategies/${strategyId}/approve`, { method: "POST" });
      const body = (await response.json()) as { result?: unknown; code?: string; userMessage?: string; error?: string };
      if (!response.ok || !body.result) throw new Error(apiErrorMessage(body, "We couldn't generate recommendations right now."));
      sessionStorage.setItem(`benchflow:result:${strategyId}`, JSON.stringify(body.result));
      router.push(`/strategy/${strategyId}/results`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't generate recommendations right now.");
    } finally {
      setBusy(false);
    }
  }

  if (!integrationsConfigured) return <IntegrationNotice />;
  if (error && !data) return <div className="card empty-state"><h2>Workflow unavailable</h2><p>{error}</p></div>;
  if (!data) return <div className="trial-processing" aria-live="polite"><LoadingCounter label="Understanding your work…" /></div>;

  const projectTitle = data.strategy.originalInput || data.strategy.title || "Workflow Review";

  return (
    <div className="trial-section trial-workflow w-full max-w-6xl mx-auto pb-6">
      {/* Heading */}
      <div className="trial-section-heading">
        <h2>Here&apos;s how we understand your workflow</h2>
      </div>

      {/* Feature Cards Grid */}
      <div className="trial-workflow-cards-grid">
        {steps.map((step, index) => (
          <div className="trial-workflow-card" key={step._id}>
            <div className="trial-workflow-card-body">
              <div className="flex items-center justify-between gap-2">
                <div className="trial-step-num font-mono text-xs tracking-widest font-bold">
                  {String(index + 1).padStart(2, "0")}
                </div>
                {editing && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Move left"
                      title="Move left"
                      className="trial-card-action-btn p-1 rounded hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === steps.length - 1}
                      aria-label="Move right"
                      title="Move right"
                      className="trial-card-action-btn p-1 rounded hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={steps.length <= 1}
                      aria-label="Delete step"
                      title="Delete step"
                      className="trial-card-action-btn p-1 rounded hover:bg-red-500/10 text-red-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <input
                    aria-label="Step name"
                    value={step.name}
                    onChange={(e) => change(index, { name: e.target.value })}
                    className="w-full text-lg font-bold p-2 outline-none"
                    placeholder="Step title"
                  />
                  <textarea
                    aria-label="Step description"
                    value={step.description}
                    onChange={(event) => change(index, { description: event.target.value })}
                    className="w-full text-xs leading-relaxed p-2 min-h-[100px] resize-none outline-none"
                    placeholder="Step description"
                  />
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold leading-snug">{step.name}</h3>
                  <p className="text-xs leading-relaxed opacity-90">{step.description}</p>
                </>
              )}

              {editing && (
                <div className="pt-3 mt-auto">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(step.requirements.noAIEligible)}
                      onChange={(e) => change(index, { requirements: { ...step.requirements, noAIEligible: e.target.checked } })}
                      className="cursor-pointer flex-none"
                    />
                    <span className="text-[11px] font-mono">Manual / No AI</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="trial-workflow-add-btn-wrap">
          <button
            type="button"
            className="trial-secondary-button"
            onClick={add}
          >
            <Plus className="w-4 h-4" />
            <span>Add step</span>
          </button>
        </div>
      )}

      {error && <p className="trial-error text-center mt-4" role="alert">{error}</p>}

      {/* Centered Actions Footer */}
      <div className="trial-workflow-actions-footer">
        {editing ? (
          <>
            <button
              type="button"
              className="trial-secondary-button"
              onClick={() => {
                if (data) setSteps([...data.steps].sort((a, b) => a.order - b.order));
                setEditing(false);
              }}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="trial-primary-button"
              onClick={handleSaveAndExit}
              disabled={busy}
            >
              <span>{busy ? "Saving…" : "Save workflow"}</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="trial-secondary-button"
              onClick={() => setEditing(true)}
              disabled={busy}
            >
              <Pencil className="w-4 h-4" />
              <span>Edit workflow</span>
            </button>
            <button
              type="button"
              className="trial-primary-button"
              onClick={approve}
              disabled={busy}
            >
              <span>{busy ? "Finding your AI stack…" : "Looks good — Find my AI stack"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
