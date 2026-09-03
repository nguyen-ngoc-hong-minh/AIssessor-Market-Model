"use node";

import { actionGeneric as action, anyApi } from "convex/server";
import { ConvexError, v } from "convex/values";
import { applicationErrorData, applicationErrorFromUnknown } from "../../lib/application-errors";
import { createTaskAnalysis, getPlannerConfiguration } from "../../lib/planner/openai";
import { StrategyInputSchema } from "../../lib/planner/schema";
import { requireIdentity } from "../lib/auth";

export const analyse = action({
  args: { strategyId: v.id("strategies"), input: v.any() },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const { strategyId, input } = args;
    const validated = StrategyInputSchema.parse(input);
    const configuration = getPlannerConfiguration();
    const runId = await ctx.runMutation(anyApi.plannerDiagnostics.startRun, { strategyId, provider: configuration.provider, model: configuration.model ?? undefined });
    try {
      const analysis = await createTaskAnalysis(validated);
      await ctx.runMutation(anyApi.strategies.replaceWorkflow, {
        strategyId,
        steps: analysis.workflowSteps.map((step) => ({
          order: step.order, name: step.name, description: step.plainLanguageDescription,
          requirements: {
            inputDescription: step.inputDescription, outputDescription: step.outputDescription, dependencies: step.dependencies,
            requiredModalities: step.requiredModalities, requiredCapabilities: step.requiredCapabilities,
            requiresCurrentInformation: step.requiresCurrentInformation, privacyRequirement: step.privacyRequirement,
            commercialUseRequired: step.commercialUseRequired, minimumQuality: step.minimumQuality, importance: step.importance,
            noAIEligible: step.noAIEligible, noAIAlternative: step.noAIAlternative, humanReviewRecommended: step.humanReviewRecommended,
            assumptions: step.assumptions, canRunInParallel: step.canRunInParallel,
          },
          estimates: {
            inputLow: step.estimatedInputTokensLow, inputExpected: step.estimatedInputTokensExpected, inputHigh: step.estimatedInputTokensHigh,
            outputLow: step.estimatedOutputTokensLow, outputExpected: step.estimatedOutputTokensExpected, outputHigh: step.estimatedOutputTokensHigh,
            requests: step.estimatedRequestCount, images: step.estimatedImageCount, audioMinutes: step.estimatedAudioMinutes, videoMinutes: step.estimatedVideoMinutes,
          },
        })),
      });
      await ctx.runMutation(anyApi.strategies.saveAnalysisSummary, { strategyId, estimatedCompletionTime: analysis.estimatedTotalWorkload });
      await ctx.runMutation(anyApi.plannerDiagnostics.completeRun, { runId });
      return analysis;
    } catch (error) {
      const publicError = applicationErrorFromUnknown(error) ?? applicationErrorData("PLANNER_FAILED");
      console.error(`Planner analysis failed with ${publicError.code}`, error);
      await ctx.runMutation(anyApi.plannerDiagnostics.failRun, { runId, errorCode: publicError.code, errorMessage: publicError.userMessage });
      throw new ConvexError(publicError);
    }
  },
});
