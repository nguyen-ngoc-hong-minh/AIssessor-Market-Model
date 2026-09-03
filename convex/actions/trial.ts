"use node";

import { actionGeneric as action, anyApi } from "convex/server";
import { ConvexError, v } from "convex/values";
import { applicationErrorData } from "../../lib/application-errors";
import { budgetToUsd } from "../../lib/currency";
import { createTaskAnalysis } from "../../lib/planner/openai";
import { StrategyInputSchema, WorkflowStepSchema, validatePriorityRanking } from "../../lib/planner/schema";
import { generateStrategyPlan } from "../../lib/recommendation/engine";
import type { CanonicalModel, RecommendationContext } from "../../lib/recommendation/types";

type EvidenceItem = Record<string, unknown> & { retrievedAt: number };
type StoredModel = Record<string, unknown> & {
  _id: string; canonicalId: string; name: string; provider: string; active: boolean; modalities: string[]; capabilities: string[];
  regions: string[]; updatedAt: number; benchmarks: EvidenceItem[]; prices: EvidenceItem[]; privacy: EvidenceItem[]; licenses: EvidenceItem[];
  accessOptions?: CanonicalModel["accessOptions"]; capabilityEvidence?: Array<Record<string, unknown> & { capabilities: string[]; category: string; sourceUrl: string; verifiedAt: number; confidence: string }>;
};

function latest(items: EvidenceItem[], predicate: (item: EvidenceItem) => boolean) {
  return items.filter(predicate).sort((a, b) => b.retrievedAt - a.retrievedAt)[0];
}

function toModel(model: StoredModel): CanonicalModel {
  const quality = latest(model.benchmarks, (item) => item.metric === "artificial_analysis_intelligence_index");
  const speed = latest(model.benchmarks, (item) => item.metric === "output_tokens_per_second");
  const input = latest(model.prices, (item) => item.pricingType === "input_tokens");
  const output = latest(model.prices, (item) => item.pricingType === "output_tokens");
  const image = latest(model.prices, (item) => item.pricingType === "image_generation");
  const video = latest(model.prices, (item) => item.pricingType === "video_generation");
  const transcription = latest(model.prices, (item) => item.pricingType === "speech_transcription");
  const speech = latest(model.prices, (item) => item.pricingType === "speech_generation");
  const privacy = model.privacy[0];
  const license = model.licenses[0];
  const numberOrNull = (value: unknown) => typeof value === "number" ? value : null;
  const stringOrNull = (value: unknown) => typeof value === "string" ? value : null;
  const evidence = [
    ...model.benchmarks.map((item) => ({ kind: "benchmark" as const, source: String(item.source ?? "stored snapshot"), sourceUrl: stringOrNull(item.sourceUrl), retrievedAt: item.retrievedAt, modelVersion: stringOrNull(item.modelVersion), metricName: String(item.metric ?? "benchmark"), rawValue: item.rawValue ?? item.score ?? null, normalizedValue: numberOrNull(item.normalizedValue), category: String(item.category ?? "general"), confidence: String(item.confidence ?? "source_reported"), notes: stringOrNull(item.notes) })),
    ...(model.capabilityEvidence ?? []).map((item) => ({ kind: "capability" as const, source: "Official product documentation", sourceUrl: item.sourceUrl, retrievedAt: item.verifiedAt, modelVersion: model.canonicalId, metricName: "official_product_capabilities", rawValue: item.capabilities, normalizedValue: null, category: item.category, confidence: item.confidence, notes: stringOrNull(item.notes) })),
    ...model.prices.map((item) => ({ kind: "pricing" as const, source: String(item.source ?? "stored snapshot"), sourceUrl: stringOrNull(item.sourceUrl), retrievedAt: item.retrievedAt, modelVersion: stringOrNull(item.modelVersion), metricName: String(item.pricingType ?? "pricing"), rawValue: item.amount ?? null, normalizedValue: null, category: "cost", confidence: String(item.confidence ?? "source_reported"), notes: stringOrNull(item.notes) })),
    ...model.privacy.map((item) => ({ kind: "privacy" as const, source: String(item.source ?? "stored snapshot"), sourceUrl: stringOrNull(item.sourceUrl), retrievedAt: item.retrievedAt, modelVersion: null, metricName: "privacy_level", rawValue: item.level ?? null, normalizedValue: null, category: "privacy", confidence: String(item.confidence ?? "source_reported"), notes: stringOrNull(item.notes) })),
    ...model.licenses.map((item) => ({ kind: "license" as const, source: String(item.source ?? "stored snapshot"), sourceUrl: stringOrNull(item.sourceUrl), retrievedAt: item.retrievedAt, modelVersion: null, metricName: "commercial_use", rawValue: item.commercialUse ?? null, normalizedValue: null, category: "license", confidence: String(item.confidence ?? "source_reported"), notes: stringOrNull(item.notes) })),
  ];
  const retrievedAt = Math.max(0, quality?.retrievedAt ?? 0, input?.retrievedAt ?? 0, output?.retrievedAt ?? 0, image?.retrievedAt ?? 0, video?.retrievedAt ?? 0, transcription?.retrievedAt ?? 0, speech?.retrievedAt ?? 0, privacy?.retrievedAt ?? 0, license?.retrievedAt ?? 0, ...(model.capabilityEvidence ?? []).map((item) => item.verifiedAt), model.updatedAt);
  return {
    id: model._id, canonicalId: model.canonicalId, name: model.name, provider: model.provider, active: model.active,
    modalities: model.modalities as CanonicalModel["modalities"], capabilities: model.capabilities as CanonicalModel["capabilities"],
    aiFirstClass: model.aiFirstClass as CanonicalModel["aiFirstClass"], aiRole: stringOrNull(model.aiRole) ?? undefined,
    aiContributionLevel: model.aiContributionLevel as CanonicalModel["aiContributionLevel"], automationLevel: model.automationLevel as CanonicalModel["automationLevel"],
    requiredManualWork: stringOrNull(model.requiredManualWork) ?? undefined, contextWindow: numberOrNull(model.contextWindow),
    inputPricePerMillion: numberOrNull(input?.amount), outputPricePerMillion: numberOrNull(output?.amount), imagePricePerThousand: numberOrNull(image?.amount),
    videoPricePerMinute: numberOrNull(video?.amount), audioPricePerMinute: numberOrNull(transcription?.amount), speechPricePerMillionCharacters: numberOrNull(speech?.amount),
    qualityScore: numberOrNull(quality?.score), outputTokensPerSecond: numberOrNull(speed?.score),
    privacyLevel: (privacy?.level ?? model.privacyLevel ?? null) as CanonicalModel["privacyLevel"], commercialUse: (license?.commercialUse ?? model.commercialUse ?? null) as boolean | null,
    regions: model.regions, source: String(quality?.source ?? input?.source ?? model.capabilityEvidence?.[0]?.sourceUrl ?? "stored snapshot"),
    sourceUrl: stringOrNull(quality?.sourceUrl ?? input?.sourceUrl ?? model.capabilityEvidence?.[0]?.sourceUrl), measuredAt: numberOrNull(quality?.measuredAt), retrievedAt,
    existingTool: false, evidence, mappingConfidence: model.mappingConfidence as CanonicalModel["mappingConfidence"], accessOptions: model.accessOptions ?? [],
  };
}

function recommendationContext(input: ReturnType<typeof StrategyInputSchema.parse>): RecommendationContext {
  const oneOff = input.usageType === "one_off";
  const projectDescription = oneOff ? input.projectBrief : input.monthlyTasks.map((task) => task.task).join("; ");
  const budgetAmount = input.budgetAmount ?? null;
  const budgetCurrency = input.budgetCurrency ?? "USD";
  return {
    priorities: validatePriorityRanking(input.priorities), budgetUsd: budgetToUsd(budgetAmount, budgetCurrency),
    budgetOriginalAmount: budgetAmount, budgetOriginalCurrency: budgetCurrency, region: "global", now: Date.now(), existingTools: input.existingTools,
    usageType: input.usageType, deadline: oneOff ? input.deadline : undefined, projectDescription,
    expectedResult: oneOff ? input.projectBrief : "A recurring AI workflow for the described work",
    informationSensitivity: input.optionalContext.informationSensitivity, commercialUse: input.optionalContext.commercialUse,
    providersToAvoid: input.optionalContext.providersToAvoid, preferredLanguage: input.optionalContext.preferredLanguage,
    expectedOutputs: input.optionalContext.expectedOutputs,
  };
}

export const analyse = action({
  args: { trialId: v.id("trials"), tokenHash: v.string() },
  handler: async (ctx, { trialId, tokenHash }) => {
    const trial = await ctx.runQuery(anyApi.trials.getInternal, { trialId, tokenHash });
    const input = StrategyInputSchema.parse(trial.input);
    const analysis = await createTaskAnalysis(input);
    await ctx.runMutation(anyApi.trials.saveAnalysis, { trialId, tokenHash, analysis });
    return analysis;
  },
});

export const recommend = action({
  args: { trialId: v.id("trials"), tokenHash: v.string(), workflowSteps: v.array(v.any()) },
  handler: async (ctx, { trialId, tokenHash, workflowSteps }) => {
    const trial = await ctx.runQuery(anyApi.trials.getInternal, { trialId, tokenHash });
    const input = StrategyInputSchema.parse(trial.input);
    const steps = WorkflowStepSchema.array().parse(workflowSteps);
    const snapshots = await ctx.runQuery(anyApi.modelSync.latestValidSnapshots, {});
    if (!snapshots.length) throw new ConvexError(applicationErrorData("INSUFFICIENT_EVIDENCE"));
    const snapshot = [...snapshots].sort((a, b) => b.fetchedAt - a.fetchedAt)[0];
    const summary = [...snapshots].sort((a, b) => a.fetchedAt - b.fetchedAt).map((item) => ({ id: item._id, fetchedAt: item.fetchedAt, source: item.source, sourceUrl: item.sourceUrl, attribution: item.attribution, sourceVersion: item.sourceVersion }));
    const storedModels = await ctx.runQuery(anyApi.models.catalogInternal, {}) as StoredModel[];
    const existingTools = input.existingTools;
    const models = storedModels.map(toModel).map((model) => ({
      ...model,
      existingTool: Boolean(model.accessOptions?.some((access) => access.accessMethod === "product" && existingTools.some((tool) => `${access.productName ?? ""} ${access.planName ?? ""}`.toLowerCase().includes(tool.toLowerCase())))),
    }));
    const plan = generateStrategyPlan(steps, models, recommendationContext(input), "recommended");
    const result = { locked: false, usageType: input.usageType, plans: [plan], dataSnapshot: { id: snapshot._id, fetchedAt: Math.min(...summary.map((item) => item.fetchedAt)), sources: summary } };
    await ctx.runMutation(anyApi.trials.saveResult, { trialId, tokenHash, workflowSteps: steps, result, dataSnapshotId: snapshot._id, dataSnapshotSummary: summary });
    return result;
  },
});
