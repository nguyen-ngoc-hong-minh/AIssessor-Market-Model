import { internalMutationGeneric as internalMutation, internalQueryGeneric as internalQuery, mutationGeneric as mutation } from "convex/server";
import { v } from "convex/values";
import { budgetToUsd } from "../lib/currency";
import { StrategyInputSchema, WorkflowStepSchema, type WorkflowStep } from "../lib/planner/schema";
import type { StrategyPlan } from "../lib/recommendation/types";
import { requireUser } from "./lib/auth";

const TRIAL_LIFETIME_MS = 24 * 60 * 60 * 1000;

function assertTrialAccess<T extends { tokenHash: string; expiresAt: number }>(trial: T | null, tokenHash: string): T {
  if (!trial || trial.tokenHash !== tokenHash || trial.expiresAt < Date.now()) throw new Error("Trial not found or expired");
  return trial;
}

function storedStep(step: WorkflowStep) {
  return {
    order: step.order,
    name: step.name,
    description: step.plainLanguageDescription,
    requirements: {
      inputDescription: step.inputDescription, outputDescription: step.outputDescription, dependencies: step.dependencies,
      canRunInParallel: step.canRunInParallel, requiredModalities: step.requiredModalities, requiredCapabilities: step.requiredCapabilities,
      requiresCurrentInformation: step.requiresCurrentInformation, privacyRequirement: step.privacyRequirement,
      commercialUseRequired: step.commercialUseRequired, minimumQuality: step.minimumQuality, importance: step.importance,
      noAIEligible: step.noAIEligible, noAIAlternative: step.noAIAlternative, humanReviewRecommended: step.humanReviewRecommended,
      assumptions: step.assumptions,
    },
    estimates: {
      inputLow: step.estimatedInputTokensLow, inputExpected: step.estimatedInputTokensExpected, inputHigh: step.estimatedInputTokensHigh,
      outputLow: step.estimatedOutputTokensLow, outputExpected: step.estimatedOutputTokensExpected, outputHigh: step.estimatedOutputTokensHigh,
      requests: step.estimatedRequestCount, images: step.estimatedImageCount, audioMinutes: step.estimatedAudioMinutes,
      videoMinutes: step.estimatedVideoMinutes,
    },
  };
}

export const create = mutation({
  args: { tokenHash: v.string(), input: v.any() },
  handler: async (ctx, { tokenHash, input }) => {
    if (!/^[a-f0-9]{64}$/.test(tokenHash)) throw new Error("Invalid trial token");
    const validated = StrategyInputSchema.parse(input);
    const now = Date.now();
    return ctx.db.insert("trials", { tokenHash, input: validated, status: "created", createdAt: now, updatedAt: now, expiresAt: now + TRIAL_LIFETIME_MS });
  },
});

export const getInternal = internalQuery({
  args: { trialId: v.id("trials"), tokenHash: v.string() },
  handler: async (ctx, { trialId, tokenHash }) => assertTrialAccess(await ctx.db.get(trialId), tokenHash),
});

export const saveAnalysis = internalMutation({
  args: { trialId: v.id("trials"), tokenHash: v.string(), analysis: v.any() },
  handler: async (ctx, { trialId, tokenHash, analysis }) => {
    assertTrialAccess(await ctx.db.get(trialId), tokenHash);
    const steps = WorkflowStepSchema.array().parse(analysis.workflowSteps);
    await ctx.db.patch(trialId, { analysis, workflowSteps: steps, status: "analysed", updatedAt: Date.now() });
  },
});

export const saveResult = internalMutation({
  args: { trialId: v.id("trials"), tokenHash: v.string(), workflowSteps: v.array(v.any()), result: v.any(), dataSnapshotId: v.id("dataSnapshots"), dataSnapshotSummary: v.any() },
  handler: async (ctx, args) => {
    assertTrialAccess(await ctx.db.get(args.trialId), args.tokenHash);
    const workflowSteps = WorkflowStepSchema.array().parse(args.workflowSteps);
    await ctx.db.patch(args.trialId, { workflowSteps, result: args.result, dataSnapshotId: args.dataSnapshotId, dataSnapshotSummary: args.dataSnapshotSummary, status: "complete", updatedAt: Date.now() });
  },
});

export const claim = mutation({
  args: { trialId: v.id("trials"), tokenHash: v.string() },
  handler: async (ctx, { trialId, tokenHash }) => {
    const user = await requireUser(ctx);
    const trial = assertTrialAccess(await ctx.db.get(trialId), tokenHash);
    if (trial.claimedStrategyId) {
      if (String(trial.claimedUserId) !== String(user._id)) throw new Error("Trial already claimed");
      return trial.claimedStrategyId;
    }
    if (trial.status !== "complete" || !trial.result || !trial.workflowSteps || !trial.dataSnapshotId) throw new Error("Complete the trial before saving");
    const input = StrategyInputSchema.parse(trial.input);
    const steps = WorkflowStepSchema.array().parse(trial.workflowSteps);
    const plans = (trial.result as { plans?: StrategyPlan[] }).plans ?? [];
    if (!plans.length) throw new Error("Trial result is missing");
    const oneOff = input.usageType === "one_off";
    const description = oneOff ? input.projectBrief : input.monthlyTasks.map((task) => `${task.task} (${task.frequency}, ${task.quality})`).join("; ");
    const title = (oneOff ? input.projectBrief : input.monthlyTasks[0].task).slice(0, 70);
    const now = Date.now();
    const strategyId = await ctx.db.insert("strategies", {
      userId: user._id, usageType: input.usageType, title, originalInput: description,
      expectedResult: oneOff ? input.projectBrief : "A recurring monthly AI workflow for every listed task",
      deadline: oneOff ? input.deadline : undefined,
      budget: budgetToUsd(input.budgetAmount ?? null, input.budgetCurrency ?? "USD") ?? undefined,
      budgetAmount: input.budgetAmount ?? undefined, budgetCurrency: input.budgetCurrency,
      monthlyTasks: oneOff ? undefined : input.monthlyTasks, existingTools: input.existingTools, priorities: input.priorities,
      informationSensitivity: input.optionalContext.informationSensitivity, commercialUse: input.optionalContext.commercialUse,
      providersToAvoid: input.optionalContext.providersToAvoid, preferredLanguage: input.optionalContext.preferredLanguage,
      expectedOutputs: input.optionalContext.expectedOutputs || undefined, status: "complete", createdAt: now, updatedAt: now,
    });
    for (const step of steps) await ctx.db.insert("workflowSteps", { strategyId, ...storedStep(step), approved: true, createdAt: now, updatedAt: now });
    for (const plan of plans) await ctx.db.insert("strategyPlans", {
      strategyId, planType: plan.variant, recommendations: [], costEstimate: { fixed: plan.fixedCostUsd, api: plan.apiCostUsd, total: plan.totalCostUsd },
      timeEstimate: {}, confidence: plan.steps.some((step) => step.selected?.label === "Limited Evidence") ? "Limited Evidence" : "Good Fit",
      assumptions: plan.assumptions, dataSnapshotId: trial.dataSnapshotId, dataSnapshotSummary: trial.dataSnapshotSummary,
      fullPlan: plan, createdAt: now,
    });
    await ctx.db.patch(trialId, { status: "claimed", claimedUserId: user._id, claimedStrategyId: strategyId, claimedAt: now, updatedAt: now });
    return strategyId;
  },
});
