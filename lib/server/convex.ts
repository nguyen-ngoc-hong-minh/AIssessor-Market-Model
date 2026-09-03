import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { headers } from "next/headers";
import { APPLICATION_ERROR_MESSAGES, applicationErrorData, applicationErrorFromUnknown, type ApplicationErrorCode } from "@/lib/application-errors";
import { resolveConvexUrl } from "@/lib/convex-deployment";

type QueryReference = Parameters<ConvexHttpClient["query"]>[0];
type MutationReference = Parameters<ConvexHttpClient["mutation"]>[0];
type ActionReference = Parameters<ConvexHttpClient["action"]>[0];
type Args = Record<string, unknown>;

const clerk = createClerkClient({
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function serverAuth() {
  const requestHeaders = new Headers(await headers());
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const state = await clerk.authenticateRequest(new Request(`${protocol}://${host}`, { headers: requestHeaders }), {
    acceptsToken: "session_token",
  });

  if (!state.isAuthenticated) throw new Error("Unauthenticated");
  return state.toAuth();
}

export async function authenticatedConvex() {
  const url = resolveConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL);
  const session = await serverAuth();
  const token = await session.getToken({ template: "convex" });
  if (!token) throw new Error("Unable to obtain a Convex identity token");

  const client = new ConvexHttpClient(url);
  client.setAuth(token);
  await client.mutation(anyApi.users.ensureCurrent, {});

  return {
    query: (reference: QueryReference, args: Args) => client.query(reference, args),
    mutation: (reference: MutationReference, args: Args) => client.mutation(reference, args),
    action: (reference: ActionReference, args: Args) => client.action(reference, args),
  };
}

export type AuthenticatedConvexClient = Awaited<ReturnType<typeof authenticatedConvex>>;

export function apiError(error: unknown) {
  console.error("Server request failed", error);
  const known = applicationErrorFromUnknown(error);
  const message = error instanceof Error ? error.message : "";
  const publicError = known ?? legacyError(message);
  const statusByCode: Partial<Record<ApplicationErrorCode, number>> = {
    PLANNER_NOT_CONFIGURED: 503, PLANNER_FAILED: 503, WORKFLOW_NOT_APPROVED: 409, INSUFFICIENT_EVIDENCE: 422,
    UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, INVALID_REQUEST: 400, INTERNAL_ERROR: 500,
  };
  return Response.json({ ...publicError, error: publicError.userMessage }, { status: statusByCode[publicError.code] ?? 500 });
}

function legacyError(message: string) {
  if (message === "Unauthenticated") return applicationErrorData("UNAUTHENTICATED");
  if (message === "Forbidden" || message === "Administrator access required") return applicationErrorData("FORBIDDEN");
  if (message === "Not found") return applicationErrorData("NOT_FOUND");
  if (/Planner AI is not configured/i.test(message)) return applicationErrorData("PLANNER_NOT_CONFIGURED");
  if (/Approve the workflow/i.test(message)) return applicationErrorData("WORKFLOW_NOT_APPROVED");
  if (/No valid model-data snapshot/i.test(message)) return applicationErrorData("INSUFFICIENT_EVIDENCE");
  if (/ZodError|validation|invalid/i.test(message)) return applicationErrorData("INVALID_REQUEST");
  return { code: "INTERNAL_ERROR" as const, userMessage: APPLICATION_ERROR_MESSAGES.INTERNAL_ERROR };
}
