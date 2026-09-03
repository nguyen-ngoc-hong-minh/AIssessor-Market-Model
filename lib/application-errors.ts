export const APPLICATION_ERROR_MESSAGES = {
  PLANNER_NOT_CONFIGURED: "The AI workflow planner is temporarily unavailable.",
  PLANNER_FAILED: "We couldn't analyze your project right now. Please try again later.",
  WORKFLOW_NOT_APPROVED: "Please review your workflow before generating recommendations.",
  INSUFFICIENT_EVIDENCE: "We don't have enough current evidence to make a reliable recommendation yet.",
  UNAUTHENTICATED: "Please sign in to continue.",
  FORBIDDEN: "You don't have access to this resource.",
  NOT_FOUND: "The requested item could not be found.",
  INVALID_REQUEST: "Please check the submitted information and try again.",
  INTERNAL_ERROR: "We couldn't complete this request right now. Please try again later.",
} as const;

export type ApplicationErrorCode = keyof typeof APPLICATION_ERROR_MESSAGES;
export type ApplicationErrorData = { code: ApplicationErrorCode; userMessage: string };

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;
  readonly userMessage: string;

  constructor(code: ApplicationErrorCode, userMessage: string = APPLICATION_ERROR_MESSAGES[code]) {
    super(userMessage);
    this.name = "ApplicationError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

export function applicationErrorData(code: ApplicationErrorCode, userMessage: string = APPLICATION_ERROR_MESSAGES[code]): ApplicationErrorData {
  return { code, userMessage };
}

export function isApplicationErrorData(value: unknown): value is ApplicationErrorData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.code === "string" && candidate.code in APPLICATION_ERROR_MESSAGES && typeof candidate.userMessage === "string";
}

export function applicationErrorFromUnknown(error: unknown): ApplicationErrorData | null {
  if (error instanceof ApplicationError) return applicationErrorData(error.code, error.userMessage);
  if (error && typeof error === "object" && "data" in error && isApplicationErrorData((error as { data?: unknown }).data)) return (error as { data: ApplicationErrorData }).data;
  return null;
}
