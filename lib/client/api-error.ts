import type { ApplicationErrorCode } from "../application-errors";

type ApiErrorBody = { code?: ApplicationErrorCode; userMessage?: string; error?: string };

const FLOW_MESSAGES: Partial<Record<ApplicationErrorCode, string>> = {
  PLANNER_NOT_CONFIGURED: "We couldn't analyze your project right now. Please try again later.",
  PLANNER_FAILED: "We couldn't analyze your project right now. Please try again later.",
  WORKFLOW_NOT_APPROVED: "Please review your workflow before generating recommendations.",
  INSUFFICIENT_EVIDENCE: "We don't have enough current evidence to make a reliable recommendation yet.",
};

export function apiErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const candidate = body as ApiErrorBody;
  if (candidate.code && FLOW_MESSAGES[candidate.code]) return FLOW_MESSAGES[candidate.code]!;
  if (candidate.userMessage && !looksTechnical(candidate.userMessage)) return candidate.userMessage;
  if (candidate.error && !looksTechnical(candidate.error)) return candidate.error;
  return fallback;
}

function looksTechnical(message: string) {
  return /request id|server error|uncaught error|\.tsx?|\.jsx?|node_modules| at \w|stack/i.test(message);
}
