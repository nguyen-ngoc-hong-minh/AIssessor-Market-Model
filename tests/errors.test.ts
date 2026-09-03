import { describe, expect, it, vi } from "vitest";
import { ConvexError } from "convex/values";
import { apiErrorMessage } from "@/lib/client/api-error";
import { applicationErrorData } from "@/lib/application-errors";
import { apiError, type AuthenticatedConvexClient } from "@/lib/server/convex";
import { approveThenGenerate, generateMonthlyRecommendations } from "@/lib/server/workflow-generation";

describe("public application errors", () => {
  it("preserves structured workflow errors without exposing Convex internals", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = apiError(new ConvexError(applicationErrorData("WORKFLOW_NOT_APPROVED")));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ code: "WORKFLOW_NOT_APPROVED", userMessage: "Please review your workflow before generating recommendations.", error: "Please review your workflow before generating recommendations." });
  });
  it("does not expose raw request IDs or stack-like errors in the frontend", () => {
    expect(apiErrorMessage({ error: "[Request ID: abc] Server Error Uncaught Error at convex/actions/recommend.ts" }, "Recommendations unavailable")).toBe("Recommendations unavailable");
  });
});

describe("workflow approval order", () => {
  it("awaits approval before requesting recommendations", async () => {
    const order: string[] = [];
    const client = {
      mutation: vi.fn(async () => { order.push("approved"); }),
      action: vi.fn(async () => { order.push("recommended"); return { plans: [] }; }),
    } as unknown as AuthenticatedConvexClient;
    const result = await approveThenGenerate(client, "strategy-id");
    expect(order).toEqual(["approved", "recommended"]);
    expect(result).toEqual({ plans: [] });
  });
  it("auto-approves monthly work but leaves one-off projects for review", async () => {
    const client = {
      mutation: vi.fn(async () => undefined),
      action: vi.fn(async () => ({ plans: [{ variant: "recommended" }] })),
    } as unknown as AuthenticatedConvexClient;
    expect(await generateMonthlyRecommendations(client, "monthly-id", "monthly")).toEqual({ plans: [{ variant: "recommended" }] });
    expect(client.mutation).toHaveBeenCalledTimes(1);
    expect(client.action).toHaveBeenCalledTimes(1);
    expect(await generateMonthlyRecommendations(client, "one-off-id", "one_off")).toBeNull();
    expect(client.mutation).toHaveBeenCalledTimes(1);
    expect(client.action).toHaveBeenCalledTimes(1);
  });
});
