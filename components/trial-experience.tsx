"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Check, ChevronDown, LoaderCircle, Plus, Sparkles, Trash2, FolderPlus, CalendarRange, ArrowUpRight, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiErrorMessage } from "@/lib/client/api-error";
import { frequencyToMonthlyUses, type MonthlyTask, type Priority, type TaskAnalysis, type WorkflowStep } from "@/lib/planner/schema";
import type { StrategyPlan } from "@/lib/recommendation/types";
import { Brand } from "./brand";
import { BriefSuggestions } from "./brief-suggestions";
import { InfoTip } from "./info-tip";
import { PixelCanvas } from "./pixel-canvas";
import { LoadingCounter } from "./loading-counter";
import { PixelTransition } from "./pixel-transition";
import { TrialResults } from "./trial-results";
import { VisualModeToggle } from "./visual-mode-toggle";

type Frequency = "once" | "occasionally" | "monthly" | "ongoing";
type Currency = "USD" | "AUD" | "VND";
type Phase = "intro" | "type-selection" | "parameters" | "workflow" | "processing" | "results";
type Result = { locked: boolean; usageType: "one_off" | "monthly"; plans: StrategyPlan[]; dataSnapshot: { fetchedAt: number } };
type SignedInMode = "one_off" | "monthly";

const defaultPriorities: Priority[] = ["balanced", "lowest_cost", "highest_quality", "existing_tools", "fastest", "privacy"];

const popularTools = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Midjourney", "Cursor", "Canva", "Copilot"];
const loadingMessages = ["Looking at your workflow…", "Comparing AI tools…", "Checking for overlaps…", "Trimming the extras…", "Building your stack…"];
const monthlyFrequencyValues = [
  { value: "rarely", label: "Rarely" },
  { value: "occasionally", label: "Occasionally" },
  { value: "weekly", label: "Weekly" },
  { value: "several_week", label: "Several times a week" },
  { value: "daily", label: "Daily" },
] as const;
const monthlyQualityValues = [
  { value: "good_enough", label: "Good enough" },
  { value: "good", label: "Good" },
  { value: "professional", label: "Professional" },
  { value: "best", label: "Best possible" },
] as const;

function suggestedBudgets(currency: Currency) {
  if (currency === "VND") return [25_000, 75_000, 125_000, 250_000];
  return [1, 3, 5, 10];
}

function budgetLabel(amount: number, currency: Currency) {
  if (currency === "VND") return `${amount.toLocaleString("vi-VN")} ₫`;
  return `${currency === "AUD" ? "A$" : "$"}${amount}`;
}

function phaseToHash(p: Phase): string {
  switch (p) {
    case "intro": return "intro";
    case "type-selection": return "choose-usage";
    case "parameters": return "parameters";
    case "workflow": return "workflow";
    case "processing": return "processing";
    case "results": return "results";
    default: return "";
  }
}

function hashToPhase(hash: string): Phase | null {
  const clean = hash.replace(/^#/, "").toLowerCase();
  if (clean === "intro" || clean === "start" || clean === "home") return "intro";
  if (clean === "choose-usage" || clean === "usage" || clean === "type-selection" || clean === "plan") return "type-selection";
  if (clean === "parameters" || clean === "form" || clean === "project" || clean === "monthly") return "parameters";
  if (clean === "workflow") return "workflow";
  if (clean === "processing" || clean === "loading") return "processing";
  if (clean === "results" || clean === "result" || clean === "recommendation" || clean === "stack") return "results";
  return null;
}

export function TrialExperience({ signedInMode }: { signedInMode?: SignedInMode } = {}) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const authenticatedBuilder = Boolean(signedInMode);
  const cacheKey = authenticatedBuilder ? `aissessor:builder:${signedInMode}` : "aissessor:trial";
  const parameterRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [activeMode, setActiveMode] = useState<SignedInMode | undefined>(signedInMode);
  const [phase, setPhase] = useState<Phase>(authenticatedBuilder ? "parameters" : "intro");
  const [editingWorkflow, setEditingWorkflow] = useState(false);
  const [brief, setBrief] = useState("");
  const [monthlyTaskDraft, setMonthlyTaskDraft] = useState("");
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [frequency, setFrequency] = useState<Frequency>(activeMode === "monthly" ? "monthly" : "once");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [budgetChoice, setBudgetChoice] = useState("5");
  const [customBudget, setCustomBudget] = useState("");
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [otherTool, setOtherTool] = useState("");
  const [informationSensitivity, setInformationSensitivity] = useState("standard");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [expectedOutputs, setExpectedOutputs] = useState("");
  const [commercialUse, setCommercialUse] = useState(true);
  const [trialId, setTrialId] = useState("");
  const [trialToken, setTrialToken] = useState("");
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingSave, setPendingSave] = useState(false);
  const [savedStrategyId, setSavedStrategyId] = useState("");

  const recurring = frequency === "monthly" || frequency === "ongoing";
  const budgets = useMemo(() => suggestedBudgets(currency), [currency]);

  function transitionToPhase(nextPhase: Phase, options?: { replace?: boolean }) {
    setPhase(nextPhase);
    if (!authenticatedBuilder && typeof window !== "undefined") {
      const targetHash = phaseToHash(nextPhase);
      const hashStr = targetHash === "intro" ? "" : `#${targetHash}`;
      if (options?.replace) {
        window.history.replaceState(null, "", hashStr || window.location.pathname);
      } else if (window.location.hash !== hashStr) {
        window.history.pushState(null, "", hashStr || window.location.pathname);
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (authenticatedBuilder || typeof window === "undefined") return;

    function syncFromHash() {
      const targetPhase = hashToPhase(window.location.hash);
      if (targetPhase) {
        setPhase(targetPhase);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (!window.location.hash || window.location.hash === "#") {
        setPhase("intro");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, [authenticatedBuilder]);

  useEffect(() => {
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return;
    let frame = 0;
    try {
      const saved = JSON.parse(cached) as { trialId: string; token: string; analysis: TaskAnalysis; steps: WorkflowStep[]; result?: Result; pendingSave?: boolean };
      if (!saved.trialId || !saved.token || !saved.analysis) return;
      frame = window.requestAnimationFrame(() => {
        setTrialId(saved.trialId); setTrialToken(saved.token); setAnalysis(saved.analysis); setSteps(saved.steps);
        if (saved.result) {
          setResult(saved.result);
          setPendingSave(saved.pendingSave ?? authenticatedBuilder);
          if (window.location.hash === "#results" || window.location.hash === "#workflow") {
            transitionToPhase(hashToPhase(window.location.hash) || "results", { replace: true });
          }
        }
      });
    } catch { sessionStorage.removeItem(cacheKey); }
    return () => window.cancelAnimationFrame(frame);
  }, [authenticatedBuilder, cacheKey]);

  useEffect(() => {
    if (!trialId || !trialToken || !analysis || savedStrategyId) return;
    sessionStorage.setItem(cacheKey, JSON.stringify({ trialId, token: trialToken, analysis, steps, result, pendingSave }));
  }, [analysis, cacheKey, pendingSave, result, savedStrategyId, steps, trialId, trialToken]);

  useEffect(() => {
    if (phase !== "processing") return;
    const timer = window.setInterval(() => setLoadingIndex((index) => (index + 1) % loadingMessages.length), 950);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (!isSignedIn || !pendingSave || !result || !trialId || !trialToken || busy) return;
    void saveTrial();
    // saveTrial deliberately runs only when authentication changes after the modal closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, pendingSave]);

  function begin() {
    transitionToPhase("type-selection");
  }

  function goToHomepage(e?: React.MouseEvent) {
    if (!authenticatedBuilder) {
      if (e) e.preventDefault();
      transitionToPhase("intro");
    }
  }

  function handleBack() {
    if (authenticatedBuilder && phase === "parameters") {
      router.push("/home");
      return;
    }
    if (phase === "type-selection") {
      transitionToPhase("intro");
    } else if (phase === "parameters") {
      transitionToPhase("type-selection");
    } else if (phase === "workflow") {
      transitionToPhase("parameters");
    } else if (phase === "results") {
      transitionToPhase(activeMode === "monthly" ? "parameters" : "workflow");
    }
  }

  function handleNext() {
    if (phase === "intro") {
      begin();
    } else if (phase === "type-selection") {
      if (!activeMode) {
        setActiveMode("one_off");
        setFrequency("once");
      }
      transitionToPhase("parameters");
    } else if (phase === "parameters") {
      formRef.current?.requestSubmit();
    } else if (phase === "workflow") {
      void recommend();
    }
  }

  const canGoBack = authenticatedBuilder ? phase !== "processing" : (phase !== "intro" && phase !== "processing");
  const canGoNext = phase !== "results" && phase !== "processing";

  function toggleTool(tool: string) {
    setSelectedTools((current) => current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool]);
  }

  function addMonthlyTask() {
    const task = monthlyTaskDraft.trim();
    if (!task) return;
    setMonthlyTasks((current) => [...current, { id: crypto.randomUUID(), task, frequency: "weekly", monthlyUses: frequencyToMonthlyUses("weekly"), quality: "professional" }]);
    setMonthlyTaskDraft("");
  }

  function updateMonthlyTask(id: string, patch: Partial<MonthlyTask>) {
    setMonthlyTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  }

  function payload() {
    const amount = Number(budgetChoice === "custom" ? customBudget : budgetChoice);
    const existingTools = [...selectedTools, otherTool.trim()].filter(Boolean);
    const optionalContext = { informationSensitivity, commercialUse, providersToAvoid: [], preferredLanguage, expectedOutputs };
    if (activeMode === "monthly") {
      return {
        usageType: "monthly" as const, monthlyTasks, priorities: defaultPriorities, budgetAmount: amount, budgetCurrency: currency, existingTools, optionalContext,
      };
    }
    if (recurring) {
      const normalizedFrequency = frequency === "ongoing" ? "several_week" as const : "weekly" as const;
      return {
        usageType: "monthly" as const, monthlyTasks: [{ id: crypto.randomUUID(), task: brief.trim(), frequency: normalizedFrequency, monthlyUses: frequencyToMonthlyUses(normalizedFrequency), quality: "good" as const }],
        priorities: defaultPriorities, budgetAmount: amount, budgetCurrency: currency, existingTools, optionalContext,
      };
    }
    return { usageType: "one_off" as const, projectBrief: brief.trim(), deadline, budgetAmount: amount, budgetCurrency: currency, priorities: defaultPriorities, existingTools, optionalContext };
  }

  async function analyse(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const amount = Number(budgetChoice === "custom" ? customBudget : budgetChoice);
    if (activeMode === "monthly" && monthlyTasks.length === 0) return setError("Add at least one recurring task.");
    if (activeMode !== "monthly" && brief.trim().length < 20) return setError("Tell us a little more about what you want to finish.");
    if (!Number.isFinite(amount) || amount < 0) return setError("Enter a valid AI-only budget.");
    setBusy(true);
    try {
      const response = await fetch("/api/trial", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload()) });
      const body = await response.json() as { trialId?: string; token?: string; analysis?: TaskAnalysis; code?: string; userMessage?: string; error?: string };
      if (!response.ok || !body.trialId || !body.token || !body.analysis) throw new Error(apiErrorMessage(body, "We couldn't understand this project right now."));
      setTrialId(body.trialId); setTrialToken(body.token); setAnalysis(body.analysis); setSteps(body.analysis.workflowSteps);
      sessionStorage.setItem(cacheKey, JSON.stringify({ trialId: body.trialId, token: body.token, analysis: body.analysis, steps: body.analysis.workflowSteps }));
      if (activeMode === "monthly") {
        await recommend(body.trialId, body.token, body.analysis.workflowSteps);
      } else {
        transitionToPhase("workflow");
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn't understand this project right now."); }
    finally { setBusy(false); }
  }

  function changeStep(index: number, patch: Partial<WorkflowStep>) {
    setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps]; [next[index], next[target]] = [next[target], next[index]];
    setSteps(next.map((step, order) => ({ ...step, order })));
  }

  function removeStep(index: number) { setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index).map((step, order) => ({ ...step, order }))); }

  function addStep() {
    setSteps((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        order: current.length,
        name: "New step",
        plainLanguageDescription: "Describe what should happen in this step.",
        inputDescription: "Required project context and requirements",
        outputDescription: "Generated deliverable or assets for this step",
        dependencies: [],
        canRunInParallel: false,
        estimatedInputTokensLow: 500,
        estimatedInputTokensExpected: 1500,
        estimatedInputTokensHigh: 3000,
        estimatedOutputTokensLow: 300,
        estimatedOutputTokensExpected: 800,
        estimatedOutputTokensHigh: 1500,
        estimatedRequestCount: 1,
        estimatedImageCount: 0,
        estimatedAudioMinutes: 0,
        estimatedVideoMinutes: 0,
        requiredModalities: ["text"],
        requiredCapabilities: ["text_generation"],
        requiresCurrentInformation: false,
        privacyRequirement: "standard",
        commercialUseRequired: false,
        minimumQuality: "good",
        importance: "medium",
        noAIEligible: false,
        noAIAlternative: "Manual execution by human",
        humanReviewRecommended: true,
        assumptions: [],
      },
    ]);
  }

  async function claimTrial(id = trialId, token = trialToken) {
    const response = await fetch(`/api/trial/${id}/save`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
    const body = await response.json() as { strategyId?: string; code?: string; userMessage?: string; error?: string };
    if (!response.ok || !body.strategyId) throw new Error(apiErrorMessage(body, "We couldn't save your AI stack."));
    setSavedStrategyId(body.strategyId); setPendingSave(false); sessionStorage.removeItem(cacheKey);
  }

  async function recommend(id = trialId, token = trialToken, nextSteps = steps) {
    setError(""); setBusy(true); setLoadingIndex(0); transitionToPhase("processing");
    try {
      const response = await fetch(`/api/trial/${id}/recommend`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, workflowSteps: nextSteps }) });
      const body = await response.json() as Result | { code?: string; userMessage?: string; error?: string };
      if (!response.ok || !("plans" in body)) throw new Error(apiErrorMessage(body, "We couldn't build your AI stack right now."));
      setResult(body); transitionToPhase("results"); setPendingSave(authenticatedBuilder);
      sessionStorage.setItem(cacheKey, JSON.stringify({ trialId, token: trialToken, analysis, steps, result: body, pendingSave: authenticatedBuilder }));
      if (authenticatedBuilder && isSignedIn) {
        try {
          await claimTrial(id, token);
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : "We couldn't save your AI stack.");
        }
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn't build your AI stack right now."); transitionToPhase(activeMode === "monthly" ? "parameters" : "workflow"); }
    finally { setBusy(false); }
  }

  async function saveTrial() {
    if (!isSignedIn) { setPendingSave(true); return; }
    setBusy(true); setError("");
    try {
      await claimTrial();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "We couldn't save your AI stack."); }
    finally { setBusy(false); }
  }

  function markTrialForSave() {
    setPendingSave(true);
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return;
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ ...JSON.parse(cached), pendingSave: true }));
    } catch {
      // The state-backed persistence effect will retry with a valid payload.
    }
  }

  function handleSaveAndNavigateToSignIn() {
    markTrialForSave();
    router.push("/sign-in");
  }

  const saveControl = isSignedIn ? (
    <button type="button" className="trial-primary-button" onClick={() => void saveTrial()} disabled={busy}>{busy ? "Saving…" : "Save my AI stack"}</button>
  ) : (
    <button type="button" className="trial-primary-button" onClick={handleSaveAndNavigateToSignIn}>Save my AI stack</button>
  );

  const RootTag = authenticatedBuilder ? "div" : "main";

  return (
    <RootTag className={authenticatedBuilder ? "trial-builder-container w-full" : "trial-page"}>
      {!authenticatedBuilder && phase === "intro" && (
        <>
          <PixelTransition />
          <PixelCanvas />
        </>
      )}
      {!authenticatedBuilder && (
        <header className="trial-header">
          <Brand onClick={goToHomepage} />
          
          <div className="flex items-center gap-3">
            <VisualModeToggle />
            {isSignedIn ? (
              <Link href="/dashboard" className="trial-header-auth-btn">
                History
              </Link>
            ) : (
              <Link href="/sign-in" className="trial-header-auth-btn">
                Sign in
              </Link>
            )}
          </div>
        </header>
      )}

      {phase === "intro" && <section id="intro" className="trial-intro"><div className="trial-intro-copy"><p className="trial-kicker">YOUR AI STACK ADVISOR</p><h1 className="trial-animated-title"><span>Find your</span><em>suitable AI.</em></h1><p className="trial-intro-body">Describe the work. Get the specific AI model for each job, the way to access it, and the real estimated cost.</p><button className="trial-primary-button trial-intro-cta" onClick={begin}>Try it for free <ArrowRight /></button><small className="trial-intro-note">No sign-up required.</small></div></section>}

      {phase === "type-selection" && (
        <section id="choose-usage" className="signed-home trial-enter">
          <div className="signed-home-heading">
            <h1 id="signed-home-title">What would you like to plan?</h1>
            <div className="h-[30px]" />
          </div>
          <div className="signed-home-options">
            <button
              type="button"
              className="signed-home-option"
              style={{ cursor: "pointer", textAlign: "left", width: "100%" }}
              onClick={() => {
                setActiveMode("one_off");
                setFrequency("once");
                transitionToPhase("parameters");
              }}
            >
              <span className="signed-home-option-icon"><FolderPlus aria-hidden="true" /></span>
              <h2>One-off Project</h2>
              <p>Plan a specific deliverable, deadline, and AI budget.</p>
              <strong>Start one-off project <ArrowUpRight aria-hidden="true" /></strong>
            </button>

            <button
              type="button"
              className="signed-home-option"
              style={{ cursor: "pointer", textAlign: "left", width: "100%" }}
              onClick={() => {
                setActiveMode("monthly");
                setFrequency("monthly");
                transitionToPhase("parameters");
              }}
            >
              <span className="signed-home-option-icon"><CalendarRange aria-hidden="true" /></span>
              <h2>Monthly Workflow</h2>
              <p>Match an AI stack to tasks you complete throughout the month.</p>
              <strong>Start monthly workflow <ArrowUpRight aria-hidden="true" /></strong>
            </button>
          </div>
        </section>
      )}


      {phase === "parameters" && <section id="parameters" className="trial-parameters trial-enter" ref={parameterRef}>{activeMode === "monthly" ? <div className="trial-progress monthly-progress"><span className="active">1</span><i /><span>2</span></div> : <div className="trial-progress"><span className="active">1</span><i /><span>2</span><i /><span>3</span></div>}<div className="trial-section-heading"><h2>{activeMode === "monthly" ? "Monthly Workflow" : "One-off Project"}</h2></div>
          <form ref={formRef} onSubmit={analyse} className="trial-form">
            {activeMode === "monthly" ? <>
              <fieldset className="trial-field-wide"><legend>Recurring AI tasks <InfoTip label="Recurring AI tasks">Add each kind of work you repeat during the month. We&apos;ll recommend the best AI stack across all of them.</InfoTip></legend><div className="monthly-task-add"><input aria-label="Recurring task" value={monthlyTaskDraft} onChange={(event) => setMonthlyTaskDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addMonthlyTask(); } }} placeholder="e.g. Write a weekly research summary" /><button type="button" className="trial-secondary-button" onClick={addMonthlyTask}><Plus /> Add task</button></div></fieldset>
              {monthlyTasks.length > 0 && <fieldset className="trial-field-wide"><legend>Your monthly tasks ({monthlyTasks.length})</legend><div className="monthly-task-list">{monthlyTasks.map((task, index) => <article className="monthly-task-card" key={task.id}><div className="monthly-task-card-heading"><span>{String(index + 1).padStart(2, "0")}</span><input aria-label={`Monthly task ${index + 1}`} value={task.task} onChange={(event) => updateMonthlyTask(task.id, { task: event.target.value })} /><button type="button" aria-label={`Remove ${task.task}`} onClick={() => setMonthlyTasks((current) => current.filter((item) => item.id !== task.id))}><Trash2 /></button></div><div className="monthly-task-controls"><label><span>How often?</span><select aria-label={`Frequency for ${task.task}`} value={task.frequency} onChange={(event) => { const frequency = event.target.value as MonthlyTask["frequency"]; updateMonthlyTask(task.id, { frequency, monthlyUses: frequencyToMonthlyUses(frequency) }); }}>{monthlyFrequencyValues.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><label><span>Quality needed</span><select aria-label={`Quality for ${task.task}`} value={task.quality} onChange={(event) => updateMonthlyTask(task.id, { quality: event.target.value as MonthlyTask["quality"] })}>{monthlyQualityValues.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label></div></article>)}</div></fieldset>}
              <fieldset className="trial-field-wide"><legend>AI budget <InfoTip label="Monthly AI budget">The maximum amount you&apos;re comfortable spending each month on AI subscriptions and usage.</InfoTip></legend><div className="trial-budget-row"><select aria-label="Currency" value={currency} onChange={(event) => { const next = event.target.value as Currency; setCurrency(next); setBudgetChoice(String(suggestedBudgets(next)[2])); }}><option value="USD">USD $</option><option value="AUD">AUD A$</option><option value="VND">VND ₫</option></select>{budgets.map((amount) => <button type="button" aria-pressed={budgetChoice === String(amount)} onClick={() => setBudgetChoice(String(amount))} key={amount}>{budgetLabel(amount, currency)}</button>)}<button type="button" aria-pressed={budgetChoice === "custom"} onClick={() => setBudgetChoice("custom")}>Custom</button></div>{budgetChoice === "custom" && <label className="trial-custom-budget"><span>{currency === "VND" ? "₫" : currency === "AUD" ? "A$" : "$"}</span><input aria-label="Exact monthly AI budget" type="number" min="0" step="any" inputMode="decimal" value={customBudget} onChange={(event) => setCustomBudget(event.target.value)} placeholder="7.50" required /></label>}</fieldset>
              <fieldset className="trial-field-wide"><legend>AI products you already use <InfoTip label="Current AI tools">Add paid AI products you already use. We&apos;ll check whether they are worth keeping or overlap with something else.</InfoTip></legend><div className="trial-tool-picker">{popularTools.map((tool) => <button type="button" aria-pressed={selectedTools.includes(tool)} onClick={() => toggleTool(tool)} key={tool}>{tool}</button>)}</div><div className="trial-other-tool"><input value={otherTool} onChange={(event) => setOtherTool(event.target.value)} placeholder="Other paid AI product (optional)" /></div></fieldset>
              <details open className="trial-advanced trial-advanced-static"><summary>Optional details <ChevronDown /></summary><div className="trial-advanced-grid"><label><span>How sensitive is the information? <InfoTip label="Information sensitivity">This helps us avoid tools whose data handling may not suit your work.</InfoTip></span><select value={informationSensitivity} onChange={(event) => setInformationSensitivity(event.target.value)}><option value="standard">Standard work</option><option value="business">Confidential business</option><option value="sensitive">Sensitive information</option><option value="restricted">Restricted or regulated</option></select></label><label><span>Preferred output language <InfoTip label="Preferred language">We check whether tools can work well in the language your final output needs.</InfoTip></span><input value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} /></label><label className="wide"><span>What should the finished output include? <InfoTip label="Expected output">File types, quantities, dimensions, or delivery details change which tools can actually complete the job.</InfoTip></span><input value={expectedOutputs} onChange={(event) => setExpectedOutputs(event.target.value)} placeholder="e.g. weekly reports, social posts, or a monthly presentation" /></label><label className="trial-check wide"><input type="checkbox" checked={commercialUse} onChange={(event) => setCommercialUse(event.target.checked)} /><span>This work will be used commercially</span></label></div></details>
              {error && <p className="trial-error trial-field-wide" role="alert">{error}</p>}<div className="trial-form-footer trial-field-wide"><button className="trial-primary-button" disabled={busy || !monthlyTasks.length}>{busy ? <><LoaderCircle className="spin" /> Building your AI stack…</> : <>Find my monthly AI stack <Sparkles /></>}</button></div>
            </> : <>
            <fieldset className="trial-field-wide"><legend>What are you working on? <InfoTip label="What are you working on?">Tell us about the work you want AI to help with. The more specific you are, the better we can match tools to your needs.</InfoTip></legend><textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="e.g. Create a brand identity, write campaign copy and generate presentation visuals for a client." minLength={20} required /><BriefSuggestions brief={brief} onApply={(text) => setBrief((current) => `${current.trim()}\n\n${text}`.trim())} /></fieldset>

            <fieldset className="trial-field-wide"><legend>AI budget <InfoTip label="Project budget">The total you are willing to spend on one-off AI tools or usage to get this project done.</InfoTip></legend><div className="trial-budget-row"><select aria-label="Currency" value={currency} onChange={(event) => { const next = event.target.value as Currency; setCurrency(next); setBudgetChoice(String(suggestedBudgets(next)[2])); }}><option value="USD">USD $</option><option value="AUD">AUD A$</option><option value="VND">VND ₫</option></select>{budgets.map((amount) => <button type="button" aria-pressed={budgetChoice === String(amount)} onClick={() => setBudgetChoice(String(amount))} key={amount}>{budgetLabel(amount, currency)}</button>)}<button type="button" aria-pressed={budgetChoice === "custom"} onClick={() => setBudgetChoice("custom")}>Custom</button></div>{budgetChoice === "custom" && <label className="trial-custom-budget"><span>{currency === "VND" ? "₫" : currency === "AUD" ? "A$" : "$"}</span><input aria-label="Exact AI budget" type="number" min="0" step="any" inputMode="decimal" value={customBudget} onChange={(event) => setCustomBudget(event.target.value)} placeholder="20.00" required /></label>}</fieldset>

            <fieldset className="trial-field-wide"><legend>Deadline <InfoTip label="Deadline">Your deadline helps us favour a workflow and tools that can realistically finish the work on time.</InfoTip></legend><input className="trial-date" type="date" min={new Date().toISOString().slice(0, 10)} value={deadline} onChange={(event) => setDeadline(event.target.value)} required /></fieldset>

            <fieldset className="trial-field-wide"><legend>AI products you already use <InfoTip label="Current AI tools">Add paid AI products you already use. We&apos;ll check whether they are worth keeping or overlap with something else. API marketplaces such as OpenRouter are treated only as access routes, not owned subscriptions.</InfoTip></legend><div className="trial-tool-picker">{popularTools.map((tool) => <button type="button" aria-pressed={selectedTools.includes(tool)} onClick={() => toggleTool(tool)} key={tool}>{tool}</button>)}</div><div className="trial-other-tool"><input value={otherTool} onChange={(event) => setOtherTool(event.target.value)} placeholder="Other paid AI product (optional)" /></div></fieldset>

            <details open className="trial-advanced trial-advanced-static"><summary>Optional details <ChevronDown /></summary><div className="trial-advanced-grid"><label><span>How sensitive is the information? <InfoTip label="Information sensitivity">This helps us avoid tools whose data handling may not suit your work.</InfoTip></span><select value={informationSensitivity} onChange={(event) => setInformationSensitivity(event.target.value)}><option value="standard">Standard work</option><option value="business">Confidential business</option><option value="sensitive">Sensitive information</option><option value="restricted">Restricted or regulated</option></select></label><label><span>Preferred output language <InfoTip label="Preferred language">We check whether tools can work well in the language your final output needs.</InfoTip></span><input value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} /></label><label className="wide"><span>What should the finished output include? <InfoTip label="Expected output">File types, quantities, dimensions, or delivery details change which tools can actually complete the job.</InfoTip></span><input value={expectedOutputs} onChange={(event) => setExpectedOutputs(event.target.value)} placeholder="e.g. 10 slides, 3 square images and a PDF summary" /></label><label className="trial-check wide"><input type="checkbox" checked={commercialUse} onChange={(event) => setCommercialUse(event.target.checked)} /><span>This work will be used commercially</span></label></div></details>

            {error && <p className="trial-error trial-field-wide" role="alert">{error}</p>}<div className="trial-form-footer trial-field-wide"><button className="trial-primary-button" disabled={busy}>{busy ? <><LoaderCircle className="spin" /> Understanding your work…</> : <>Show me the workflow <ArrowRight /></>}</button></div>
            </>}
          </form>
        </section>}

      {phase === "workflow" && (
        <section id="workflow" className="trial-workflow trial-enter">
          {/* Progress bar */}
          {activeMode === "monthly" ? (
            <div className="trial-progress monthly-progress">
              <span className="done"><Check className="w-3.5 h-3.5" /></span>
              <i className="done" />
              <span className="active">2</span>
            </div>
          ) : (
            <div className="trial-progress">
              <span className="done"><Check className="w-3.5 h-3.5" /></span>
              <i className="done" />
              <span className="active">2</span>
              <i />
              <span>3</span>
            </div>
          )}

          {/* Heading */}
          <div className="trial-section-heading">
            <h2>Here&apos;s how we understand your workflow</h2>
          </div>

          {/* Feature Cards Grid */}
          <div className="trial-workflow-cards-grid">
            {steps.map((step, index) => (
              <div
                className="trial-workflow-card"
                key={step.id}
              >
                <div className="trial-workflow-card-body">
                  <div className="flex items-center justify-between gap-2">
                    <div className="trial-step-num font-mono text-xs tracking-widest font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    {editingWorkflow && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveStep(index, -1)}
                          disabled={index === 0}
                          aria-label="Move left"
                          title="Move left"
                          className="trial-card-action-btn p-1 rounded hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(index, 1)}
                          disabled={index === steps.length - 1}
                          aria-label="Move right"
                          title="Move right"
                          className="trial-card-action-btn p-1 rounded hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          disabled={steps.length <= 1}
                          aria-label="Delete step"
                          title="Delete step"
                          className="p-1 rounded hover:bg-red-500/10 text-red-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingWorkflow ? (
                    <div className="space-y-4">
                      <input
                        aria-label="Step name"
                        value={step.name}
                        onChange={(e) => changeStep(index, { name: e.target.value })}
                        className="w-full bg-[#F4F7F5] border-b border-[#0213B0] text-lg font-bold text-[#0213B0] p-2 outline-none"
                        placeholder="Step title"
                      />
                      <textarea
                        aria-label="Step description"
                        value={step.plainLanguageDescription}
                        onChange={(e) => changeStep(index, { plainLanguageDescription: e.target.value })}
                        className="w-full bg-[#F4F7F5] border-b border-[#0213B0] text-xs text-[#0213B0] leading-relaxed p-2 min-h-[100px] resize-none outline-none"
                        placeholder="Step description"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-[#0213B0] leading-snug">{step.name}</h3>
                      <p className="text-xs text-[#0213B0] leading-relaxed opacity-90">{step.plainLanguageDescription || step.outputDescription}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {editingWorkflow && (
            <div className="trial-workflow-add-btn-wrap">
              <button
                type="button"
                className="trial-secondary-button"
                onClick={addStep}
              >
                <Plus className="w-4 h-4" />
                <span>Add step</span>
              </button>
            </div>
          )}

          {error && <p className="trial-error text-center mt-4" role="alert">{error}</p>}

          {/* Centered Actions Footer */}
          <div className="trial-workflow-actions-footer">
            {editingWorkflow ? (
              <>
                <button
                  type="button"
                  className="trial-secondary-button"
                  onClick={() => setEditingWorkflow(false)}
                >
                  <Check className="w-4 h-4" />
                  <span>Done editing</span>
                </button>
                <button
                  type="button"
                  className="trial-primary-button"
                  onClick={() => void recommend()}
                  disabled={busy || !steps.length}
                >
                  {busy ? <><LoaderCircle className="spin w-4 h-4 mr-2" /> Finding AI stack…</> : "Looks good — Find my AI stack"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="trial-secondary-button"
                  onClick={() => setEditingWorkflow(true)}
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit workflow</span>
                </button>
                <button
                  type="button"
                  className="trial-primary-button"
                  onClick={() => void recommend()}
                  disabled={busy || !steps.length}
                >
                  {busy ? <><LoaderCircle className="spin w-4 h-4 mr-2" /> Finding AI stack…</> : "Looks good — Find my AI stack"}
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {phase === "processing" && (
        <section id="processing" className="trial-processing" aria-live="polite">
          <LoadingCounter label={loadingMessages[loadingIndex]} />
        </section>
      )}

      {phase === "results" && result && (
        <section id="results" className="trial-results trial-enter">
          {activeMode === "monthly" ? (
            <div className="trial-progress monthly-progress">
              <span className="done"><Check className="w-3.5 h-3.5" /></span>
              <i className="done" />
              <span className="active">2</span>
            </div>
          ) : (
            <div className="trial-progress">
              <span className="done"><Check className="w-3.5 h-3.5" /></span>
              <i className="done" />
              <span className="done"><Check className="w-3.5 h-3.5" /></span>
              <i className="done" />
              <span className="active">3</span>
            </div>
          )}
          <TrialResults result={result} mode={savedStrategyId ? "saved" : "trial"} saveControl={savedStrategyId ? <Link className="trial-primary-button" href="/dashboard">Consultation history</Link> : saveControl} savedStrategyId={savedStrategyId} />
          {error && <p className="trial-error floating" role="alert">{error}</p>}
        </section>
      )}

      {phase !== "intro" && phase !== "type-selection" && phase !== "processing" && (
        <footer className="trial-footer-nav" aria-label="Trial page navigation">
          <button
            type="button"
            className="trial-footer-arrow-btn"
            onClick={handleBack}
            disabled={!canGoBack}
            aria-label="Previous step"
            title="Previous step"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="trial-footer-arrow-btn"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Next step"
            title="Next step"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </footer>
      )}
    </RootTag>
  );
}
