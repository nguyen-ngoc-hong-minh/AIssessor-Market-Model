export const BASE_WEIGHTS = {
  performance: 22,
  cost: 18,
  speed: 13,
  privacy: 14,
  commercial: 10,
  existing: 8,
  evidence: 9,
  freshness: 6,
} as const;

export const QUALITY_MINIMUM = { draft: 0, good: 45, professional: 65, critical: 80 } as const;

export const MONTHLY_FREQUENCY_MULTIPLIERS = {
  rarely: 1,
  occasionally: 2,
  weekly: 4,
  several_week: 12,
  daily: 22,
} as const;

export { TASK_EVIDENCE_MAP, type TaskCategory } from "./taxonomy";
