"use client";

import { ArrowUpRight, CalendarRange, FolderPlus, History } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type SaveState =
  | { status: "idle" | "saving" }
  | { status: "saved"; strategyId: string }
  | { status: "error" };

export function SignedInHome() {
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const attemptedSave = useRef(false);

  const savePendingTrial = useCallback(async () => {
    const cached = sessionStorage.getItem("aissessor:trial");
    if (!cached) return;

    try {
      const trial = JSON.parse(cached) as { trialId?: string; token?: string; pendingSave?: boolean };
      if (!trial.pendingSave || !trial.trialId || !trial.token) return;

      setSaveState({ status: "saving" });
      const response = await fetch(`/api/trial/${trial.trialId}/save`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: trial.token }),
      });
      const body = await response.json() as { strategyId?: string };
      if (!response.ok || !body.strategyId) throw new Error("Unable to save trial");

      sessionStorage.removeItem("aissessor:trial");
      setSaveState({ status: "saved", strategyId: body.strategyId });
    } catch {
      setSaveState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    if (attemptedSave.current) return;
    attemptedSave.current = true;
    void savePendingTrial();
  }, [savePendingTrial]);

  return (
    <section className="signed-home" aria-labelledby="signed-home-title">
      <div className="signed-home-heading">
        <h1 id="signed-home-title">What would you like to plan?</h1>
      </div>

      {saveState.status === "saving" && (
        <div className="signed-home-save-state" role="status">Saving your trial plan to this account...</div>
      )}
      {saveState.status === "saved" && (
        <div className="signed-home-save-state is-success" role="status">
          <span>Your trial plan is now saved to this account.</span>
          <Link href={`/strategy/${saveState.strategyId}/results`}>Open saved plan <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      )}
      {saveState.status === "error" && (
        <div className="signed-home-save-state is-error" role="alert">
          <span>We could not finish saving your trial plan.</span>
          <button type="button" onClick={() => void savePendingTrial()}>Try again</button>
        </div>
      )}

      <div className="signed-home-options">
        <Link className="signed-home-option" href="/strategy/new/one-off">
          <span className="signed-home-option-icon"><FolderPlus aria-hidden="true" /></span>
          
          <h2>One-off Project</h2>
          <p>Plan a specific deliverable, deadline, and AI budget.</p>
          <strong>Start one-off project <ArrowUpRight aria-hidden="true" /></strong>
        </Link>

        <Link className="signed-home-option" href="/strategy/new/monthly">
          <span className="signed-home-option-icon"><CalendarRange aria-hidden="true" /></span>
          
          <h2>Monthly Workflow</h2>
          <p>Match an AI stack to tasks you complete throughout the month.</p>
          <strong>Start monthly workflow <ArrowUpRight aria-hidden="true" /></strong>
        </Link>
      </div>

      <div className="signed-home-history-wrap">
        <Link className="signed-home-history" href="/dashboard">
          View previous consultations <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
