"use client";

import { Sparkles, Plus } from "lucide-react";
import { getBriefSuggestions } from "@/lib/planner/brief-suggestions";

export function BriefSuggestions({ brief, onApply }: { brief: string; onApply(text: string): void }) {
  const suggestions = getBriefSuggestions(brief);
  if (!suggestions.length) return null;

  return (
    <div className="brief-suggestions-panel" aria-live="polite">
      <div className="brief-suggestions-head">
        <Sparkles className="brief-suggestions-icon" aria-hidden="true" />
        <div className="min-w-0">
          <p className="brief-suggestions-title">AI planning suggestions</p>
          <p className="brief-suggestions-desc">
            Missing details detected in your brief. Click to add a prompt, then replace the brackets. No extra AI charge.
          </p>
        </div>
      </div>
      <div className="brief-suggestions-grid">
        {suggestions.map((suggestion) => (
          <button
            type="button"
            key={suggestion.id}
            onClick={() => onApply(suggestion.text)}
            className="brief-suggestion-btn"
            title={suggestion.text}
          >
            <Plus className="w-3 h-3" />
            <span>{suggestion.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
