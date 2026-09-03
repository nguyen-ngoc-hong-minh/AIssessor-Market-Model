"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiErrorMessage } from "@/lib/client/api-error";
import { frequencyToMonthlyUses, type MonthlyTask } from "@/lib/planner/schema";
import { IntegrationNotice } from "./integration-notice";
import { OptionalDetails, defaultOptionalDetails } from "./optional-details";
import { PriorityRanking, defaultPriorityRanking } from "./priority-picker";
import { integrationsConfigured } from "./providers";

const frequencyValues = [
  { value: "rarely", label: "Rarely", uses: 1 },
  { value: "occasionally", label: "Occasionally", uses: 2 },
  { value: "weekly", label: "Weekly", uses: 4 },
  { value: "several_week", label: "Several times a week", uses: 12 },
  { value: "daily", label: "Daily", uses: 22 },
] as const;

const qualityValues = [
  { value: "good_enough", label: "Good enough" },
  { value: "good", label: "Good" },
  { value: "professional", label: "Professional" },
  { value: "best", label: "Best possible" },
] as const;

function createTask(task: string): MonthlyTask {
  return { id: crypto.randomUUID(), task, frequency: "weekly", monthlyUses: frequencyToMonthlyUses("weekly"), quality: "professional" };
}

export function MonthlyTaskBuilder() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [tasks, setTasks] = useState<MonthlyTask[]>([]);
  const [priorities, setPriorities] = useState(defaultPriorityRanking);
  const [optionalDetails, setOptionalDetails] = useState(defaultOptionalDetails);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function addTask() {
    const value = draft.trim();
    if (!value) return;
    setTasks((current) => [...current, createTask(value)]);
    setDraft("");
  }

  function updateTask(id: string, patch: Partial<MonthlyTask>) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  }

  function duplicateTask(task: MonthlyTask) {
    setTasks((current) => [...current, { ...task, id: crypto.randomUUID(), task: `${task.task} copy` }]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!tasks.length) return setError("Add at least one recurring task.");
    if (tasks.some((task) => task.task.trim().length < 3)) return setError("Each task needs a short description.");
    setBusy(true);
    try {
      const payload = {
        usageType: "monthly",
        monthlyTasks: tasks,
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
      const response = await fetch("/api/strategies", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { strategyId?: string; result?: unknown; code?: string; userMessage?: string; error?: string };
      if (!response.ok || !body.strategyId) throw new Error(apiErrorMessage(body, "We couldn't analyze your recurring work right now. Please try again later."));
      if (!body.result) throw new Error("We couldn't generate your AI stack right now. Please try again later.");
      sessionStorage.setItem(`benchflow:result:${body.strategyId}`, JSON.stringify(body.result));
      router.push(`/strategy/${body.strategyId}/results`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Planning failed");
    } finally {
      setBusy(false);
    }
  }

  if (!integrationsConfigured) return <IntegrationNotice />;

  return (
    <form className="space-y-8" onSubmit={submit}>
      {/* Section 1: Add Recurring Task */}
      <section className="settings-faint-block">
        <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
          Recurring AI Workload
        </h2>
        <div>
          <label htmlFor="new-task" className="settings-label text-xs font-mono font-semibold text-indigo-soft uppercase tracking-wider">
            What do you regularly use AI for?
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              id="new-task"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTask(); } }}
              placeholder="e.g. Create social media videos, write research summaries..."
              className="styled-input pill-input py-3.5 flex-1"
            />
            <button
              className="btn-primary text-xs px-6 py-3 rounded-full inline-flex items-center gap-2 flex-none"
              type="button"
              onClick={addTask}
            >
              <Plus className="w-4 h-4" />
              <span>Add task</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Added Task List (Rendered only when tasks.length > 0) */}
      {tasks.length > 0 && (
        <section className="settings-faint-block space-y-6">
          <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
            Configured Tasks ({tasks.length})
          </h2>
          <div className="space-y-4">
            {tasks.map((task, index) => {
              const frequencyIndex = frequencyValues.findIndex((item) => item.value === task.frequency);
              const qualityIndex = qualityValues.findIndex((item) => item.value === task.quality);
              return (
                <div className="p-[10px] rounded-3xl bg-transparent border border-transparent space-y-4" key={task.id}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold grid place-items-center flex-none">
                        {index + 1}
                      </span>
                      <input
                        aria-label={`Task ${index + 1}`}
                        value={task.task}
                        onChange={(event) => updateTask(task.id, { task: event.target.value })}
                        className="styled-input pill-input py-2 text-sm font-semibold flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-none">
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-white/10 text-ink-2 hover:text-white transition-colors"
                        title="Edit task"
                        aria-label={`Edit ${task.task}`}
                        onClick={() => document.querySelector<HTMLInputElement>(`[aria-label='Task ${index + 1}']`)?.focus()}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-white/10 text-ink-2 hover:text-white transition-colors"
                        title="Duplicate task"
                        aria-label={`Duplicate ${task.task}`}
                        onClick={() => duplicateTask(task)}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete task"
                        aria-label={`Delete ${task.task}`}
                        onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Spacer Div height 10px as requested */}
                  <div className="h-[10px]" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-ink-2 mb-1">
                        <span>Frequency</span>
                        <span className="font-semibold text-indigo-soft">{frequencyValues[frequencyIndex].label}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        step="1"
                        value={frequencyIndex}
                        onChange={(event) => {
                          const option = frequencyValues[Number(event.target.value)];
                          updateTask(task.id, { frequency: option.value, monthlyUses: option.uses });
                        }}
                        className="custom-range-slider w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-ink-2 mb-1">
                        <span>Quality Required</span>
                        <span className="font-semibold text-indigo-soft">{qualityValues[qualityIndex].label}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="1"
                        value={qualityIndex}
                        onChange={(event) => updateTask(task.id, { quality: qualityValues[Number(event.target.value)].value })}
                        className="custom-range-slider w-full"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 3: Priority Ranking */}
      <section className="settings-faint-block">
        <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
          Rank your priorities
        </h2>
        <PriorityRanking priorities={priorities} onChange={setPriorities} />
      </section>

      {/* Section 4: Project Parameters */}
      <section className="settings-faint-block">
        <h2 className="settings-section-title text-xl font-semibold text-ink font-sans">
          Project Parameters
        </h2>
        <OptionalDetails idPrefix="monthly" value={optionalDetails} onChange={setOptionalDetails} />
      </section>

      {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

      {/* Spacer Div */}
      <div className="h-[30px] w-full block" style={{ height: "30px", minHeight: "30px" }} />

      {/* Form Actions Footer */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button className="btn-primary text-xs px-8 py-3 rounded-full shadow-lg shadow-indigo-600/30" disabled={busy || !tasks.length}>
          <span>{busy ? "Finding your AI stack…" : "Find my monthly AI stack"}</span>
        </button>
      </div>
    </form>
  );
}
