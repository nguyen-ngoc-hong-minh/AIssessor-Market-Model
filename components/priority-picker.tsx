"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import type { Priority } from "@/lib/planner/schema";

export const priorityLabels: Record<Priority, string> = {
  lowest_cost: "Lowest Cost",
  balanced: "Balanced",
  highest_quality: "Highest Quality",
  fastest: "Fastest Workflow",
  privacy: "Privacy",
  existing_tools: "Use Existing Tools First",
};

export const defaultPriorityRanking: Priority[] = [
  "balanced",
  "lowest_cost",
  "highest_quality",
  "fastest",
  "privacy",
  "existing_tools",
];

export function PriorityRanking({
  priorities,
  onChange,
}: {
  priorities: Priority[];
  onChange(value: Priority[]): void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= priorities.length) return;
    const next = [...priorities];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...priorities];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-xs text-ink-3 -mt-1 mb-1">
        Drag any row to change its position, or use the arrow buttons.
      </p>
      {priorities.map((priority, index) => (
        <div
          className={`group flex items-center gap-3 w-full rounded-2xl transition-all ${dropIndex === index && draggedIndex !== index ? "ring-2 ring-indigo-400/70 ring-offset-2 ring-offset-[#0e111d]" : ""} ${draggedIndex === index ? "opacity-50 scale-[0.99]" : ""}`}
          draggable
          aria-grabbed={draggedIndex === index}
          onDragStart={(event) => {
            setDraggedIndex(index);
            setDropIndex(index);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", priority);
          }}
          onDragEnter={() => setDropIndex(index)}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedIndex !== null) reorder(draggedIndex, index);
            setDraggedIndex(null);
            setDropIndex(null);
          }}
          onDragEnd={() => {
            setDraggedIndex(null);
            setDropIndex(null);
          }}
          key={priority}
        >
          <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold grid place-items-center flex-none">
            {index + 1}
          </span>
          <div className="styled-input pill-input py-2.5 flex items-center justify-between flex-1 cursor-grab active:cursor-grabbing group-hover:border-indigo-400/40 group-hover:bg-white/[0.04]">
            <div className="flex items-center gap-2 min-w-0">
              <GripVertical className="w-4 h-4 text-ink-3 group-hover:text-indigo-300 transition-colors flex-none" aria-hidden="true" />
              <span className="text-sm font-semibold text-ink truncate">
                {priorityLabels[priority]}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-none">
              <button
                type="button"
                className="p-1 rounded-full hover:bg-white/10 text-ink-2 hover:text-white transition-colors"
                title="Move up"
                aria-label={`Move ${priorityLabels[priority]} up`}
                onClick={() => move(index, -1)}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-white/10 text-ink-2 hover:text-white transition-colors"
                title="Move down"
                aria-label={`Move ${priorityLabels[priority]} down`}
                onClick={() => move(index, 1)}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
