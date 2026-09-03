import { internalMutationGeneric as internalMutation } from "convex/server";
import { v } from "convex/values";

export const startRun = internalMutation({
  args: { strategyId: v.id("strategies"), provider: v.string(), model: v.optional(v.string()) },
  handler: async (ctx, args) => ctx.db.insert("plannerRuns", { ...args, status: "running", startedAt: Date.now() }),
});

export const completeRun = internalMutation({
  args: { runId: v.id("plannerRuns") },
  handler: async (ctx, { runId }) => ctx.db.patch(runId, { status: "success", completedAt: Date.now() }),
});

export const failRun = internalMutation({
  args: { runId: v.id("plannerRuns"), errorCode: v.string(), errorMessage: v.string() },
  handler: async (ctx, { runId, errorCode, errorMessage }) => ctx.db.patch(runId, { status: "failed", errorCode, errorMessage, completedAt: Date.now() }),
});
