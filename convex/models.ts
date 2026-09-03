import { internalMutationGeneric as internalMutation, internalQueryGeneric as internalQuery, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";
import type { QueryCtx } from "./_generated/server";
import { aiAccessMetadata, aiNativeMetadata } from "../lib/recommendation/ai-first";

const aiFirstClassValidator = v.union(v.literal("AI_NATIVE"), v.literal("AI_CENTRIC"), v.literal("AI_ASSISTED"), v.literal("TRADITIONAL"));
const contributionValidator = v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"));

const benchmarkValidator = v.object({
  metric: v.string(), score: v.number(), rawValue: v.optional(v.any()), normalizedValue: v.optional(v.number()), category: v.optional(v.string()),
  sourceUrl: v.optional(v.string()), modelVersion: v.optional(v.string()), sourceVersion: v.optional(v.string()), measuredAt: v.number(), confidence: v.string(), notes: v.optional(v.string()),
});
const priceValidator = v.object({
  pricingType: v.string(), amount: v.number(), unit: v.string(), currency: v.string(), sourceUrl: v.optional(v.string()), modelVersion: v.optional(v.string()),
  sourceVersion: v.optional(v.string()), confidence: v.optional(v.string()), notes: v.optional(v.string()), effectiveAt: v.number(),
});
const modelValidator = v.object({
  canonicalId: v.string(), name: v.string(), provider: v.string(), aliases: v.array(v.string()), modalities: v.array(v.string()), capabilities: v.array(v.string()),
  aiFirstClass: v.optional(aiFirstClassValidator), aiRole: v.optional(v.string()), aiContributionLevel: v.optional(contributionValidator),
  automationLevel: v.optional(contributionValidator), requiredManualWork: v.optional(v.string()),
  contextWindow: v.optional(v.number()), releaseDate: v.optional(v.string()), active: v.boolean(),
  status: v.union(v.literal("pending_evidence"), v.literal("eligible"), v.literal("manual_review"), v.literal("inactive")),
  mappingConfidence: v.union(v.literal("exact"), v.literal("explicit_alias"), v.literal("unmatched")), manualReviewRequired: v.boolean(), regions: v.array(v.string()),
  accessOptions: v.optional(v.array(v.object({
    label: v.string(), url: v.string(), modelId: v.string(), sourceUrl: v.string(), verifiedAt: v.number(),
    productId: v.optional(v.string()), productName: v.optional(v.string()), planId: v.optional(v.string()), planName: v.optional(v.string()),
    accessMethod: v.optional(v.union(v.literal("product"), v.literal("api"), v.literal("marketplace"), v.literal("cloud"))),
    monthlyPriceUsd: v.optional(v.number()),
    aiFirstClass: v.optional(aiFirstClassValidator), aiRole: v.optional(v.string()), aiContributionLevel: v.optional(contributionValidator),
    automationLevel: v.optional(contributionValidator), requiredManualWork: v.optional(v.string()),
  }))),
  benchmarks: v.array(benchmarkValidator), prices: v.array(priceValidator),
  privacy: v.array(v.object({ level: v.string(), sourceUrl: v.string(), confidence: v.string(), notes: v.optional(v.string()) })),
  licenses: v.array(v.object({ commercialUse: v.boolean(), sourceUrl: v.string(), confidence: v.string(), notes: v.optional(v.string()) })),
  capabilityEvidence: v.optional(v.array(v.object({
    capabilities: v.array(v.string()), category: v.string(), sourceUrl: v.string(), verifiedAt: v.number(), confidence: v.string(), notes: v.optional(v.string()),
  }))),
});

function union(left: string[] | undefined, right: string[]) { return [...new Set([...(left ?? []), ...right])]; }
type AccessOption = {
  label: string; url: string; modelId: string; sourceUrl: string; verifiedAt: number;
  productId?: string; productName?: string; planId?: string; planName?: string;
  accessMethod?: "product" | "api" | "marketplace" | "cloud"; monthlyPriceUsd?: number;
  aiFirstClass?: "AI_NATIVE" | "AI_CENTRIC" | "AI_ASSISTED" | "TRADITIONAL"; aiRole?: string;
  aiContributionLevel?: "LOW" | "MEDIUM" | "HIGH"; automationLevel?: "LOW" | "MEDIUM" | "HIGH"; requiredManualWork?: string;
};
function withAiAccessMetadata(option: AccessOption): AccessOption {
  const fallback = aiAccessMetadata(option.productName ?? option.label, option.accessMethod);
  return fallback.aiFirstClass === "TRADITIONAL" ? { ...option, ...fallback } : { ...fallback, ...option };
}
function mergeAccessOptions(left: AccessOption[] | undefined, right: AccessOption[]) {
  const options = new Map<string, AccessOption>();
  for (const option of [...(left ?? []), ...right].sort((a, b) => a.verifiedAt - b.verifiedAt)) options.set(`${option.modelId}:${option.url}`, withAiAccessMetadata(option));
  return [...options.values()];
}
type CapabilityEvidence = { capabilities: string[]; category: string; sourceUrl: string; verifiedAt: number; confidence: string; notes?: string };
function mergeCapabilityEvidence(left: CapabilityEvidence[] | undefined, right: CapabilityEvidence[]) {
  const evidence = new Map<string, CapabilityEvidence>();
  for (const item of [...(left ?? []), ...right].sort((a, b) => a.verifiedAt - b.verifiedAt)) evidence.set(`${item.sourceUrl}:${item.category}`, item);
  return [...evidence.values()];
}
function mediaFamilyKey(name: string) {
  return name.toLowerCase()
    .replace(/^[^:]{1,40}:\s*/, "")
    .replace(/\((?:high|medium|low|standard|quality)\)\s*$/i, "")
    .replace(/\[(?:max|high|medium|low)\]/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const ingest = internalMutation({
  args: { source: v.string(), retrievedAt: v.number(), models: v.array(modelValidator) },
  handler: async (ctx, args) => {
    let createdCount = 0;
    let updatedCount = 0;
    let recordsImported = 0;
    const currentModels = await ctx.db.query("canonicalModels").collect();
    const mediaFamilies = new Map<string, typeof currentModels>();
    for (const current of currentModels.filter((item) => !item.canonicalId.startsWith("artificial-analysis/") && (item.capabilities.includes("image_generation") || item.capabilities.includes("video_generation")))) {
      const key = mediaFamilyKey(current.name);
      mediaFamilies.set(key, [...(mediaFamilies.get(key) ?? []), current]);
    }
    for (const model of args.models) {
      const mediaMatch = model.canonicalId.startsWith("artificial-analysis/") ? mediaFamilies.get(mediaFamilyKey(model.name)) : undefined;
      const canonicalId = mediaMatch?.length === 1 ? mediaMatch[0].canonicalId : model.canonicalId;
      const existing = await ctx.db.query("canonicalModels").withIndex("by_canonical_id", (q) => q.eq("canonicalId", canonicalId)).unique();
      const aiMetadata = aiNativeMetadata(model.name, model.capabilities);
      const forceTraditional = aiMetadata.aiFirstClass === "TRADITIONAL";
      const values = {
        canonicalId,
        name: model.mappingConfidence === "unmatched" ? existing?.name ?? model.name : model.name,
        provider: model.mappingConfidence === "unmatched" ? existing?.provider ?? model.provider : model.provider,
        aliases: union(existing?.aliases, [...model.aliases, model.canonicalId]),
        modalities: union(existing?.modalities, model.modalities),
        capabilities: union(existing?.capabilities, model.capabilities),
        aiFirstClass: forceTraditional ? aiMetadata.aiFirstClass : model.aiFirstClass ?? existing?.aiFirstClass ?? aiMetadata.aiFirstClass,
        aiRole: forceTraditional ? aiMetadata.aiRole : model.aiRole ?? existing?.aiRole ?? aiMetadata.aiRole,
        aiContributionLevel: forceTraditional ? aiMetadata.aiContributionLevel : model.aiContributionLevel ?? existing?.aiContributionLevel ?? aiMetadata.aiContributionLevel,
        automationLevel: forceTraditional ? aiMetadata.automationLevel : model.automationLevel ?? existing?.automationLevel ?? aiMetadata.automationLevel,
        requiredManualWork: forceTraditional ? aiMetadata.requiredManualWork : model.requiredManualWork ?? existing?.requiredManualWork ?? aiMetadata.requiredManualWork,
        contextWindow: model.contextWindow ?? existing?.contextWindow,
        releaseDate: model.releaseDate ?? existing?.releaseDate,
        active: model.active && (existing?.active ?? true),
        status: model.manualReviewRequired ? "manual_review" as const : existing?.status ?? "pending_evidence" as const,
        mappingConfidence: existing?.mappingConfidence === "exact" || model.mappingConfidence === "exact" ? "exact" as const : model.mappingConfidence,
        manualReviewRequired: Boolean(existing?.manualReviewRequired || model.manualReviewRequired),
        regions: union(existing?.regions, model.regions),
        accessOptions: mergeAccessOptions(existing?.accessOptions, model.accessOptions ?? []),
        capabilityEvidence: mergeCapabilityEvidence(existing?.capabilityEvidence, model.capabilityEvidence ?? []),
        updatedAt: args.retrievedAt,
      };
      const modelId = existing ? existing._id : await ctx.db.insert("canonicalModels", values);
      if (existing) { await ctx.db.patch(existing._id, values); updatedCount += 1; } else createdCount += 1;

      for (const observation of model.benchmarks) {
        const previous = await ctx.db.query("benchmarkObservations").withIndex(
          "by_model_metric_source",
          // Generic Convex server types do not expose chained equality fields, but the declared index does.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q: any) => q.eq("modelId", modelId).eq("metric", observation.metric).eq("source", args.source).eq("modelVersion", observation.modelVersion),
        ).take(1);
        const values = { modelId, ...observation, source: args.source, retrievedAt: args.retrievedAt };
        if (previous[0]) await ctx.db.patch(previous[0]._id, values);
        else await ctx.db.insert("benchmarkObservations", values);
        recordsImported += 1;
      }
      for (const observation of model.prices) {
        const previous = await ctx.db.query("pricingObservations").withIndex(
          "by_model_type_source",
          // Generic Convex server types do not expose chained equality fields, but the declared index does.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q: any) => q.eq("modelId", modelId).eq("pricingType", observation.pricingType).eq("source", args.source).eq("modelVersion", observation.modelVersion),
        ).take(1);
        const values = { modelId, ...observation, source: args.source, retrievedAt: args.retrievedAt };
        if (previous[0]) await ctx.db.patch(previous[0]._id, values);
        else await ctx.db.insert("pricingObservations", values);
        recordsImported += 1;
      }
      for (const observation of model.privacy) {
        const previous = await ctx.db.query("privacyObservations").withIndex(
          "by_model_level_source",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q: any) => q.eq("modelId", modelId).eq("level", observation.level).eq("source", args.source),
        ).take(1);
        const values = { modelId, ...observation, source: args.source, retrievedAt: args.retrievedAt };
        if (previous[0]) await ctx.db.patch(previous[0]._id, values);
        else await ctx.db.insert("privacyObservations", values);
        recordsImported += 1;
      }
      for (const observation of model.licenses) {
        const previous = await ctx.db.query("licenseObservations").withIndex(
          "by_model_use_source",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q: any) => q.eq("modelId", modelId).eq("commercialUse", observation.commercialUse).eq("source", args.source),
        ).take(1);
        const values = { modelId, ...observation, source: args.source, retrievedAt: args.retrievedAt };
        if (previous[0]) await ctx.db.patch(previous[0]._id, values);
        else await ctx.db.insert("licenseObservations", values);
        recordsImported += 1;
      }

      const pricesFor = (pricingType: string) => ctx.db.query("pricingObservations").withIndex(
        "by_model_type",
        // Generic Convex server types do not expose chained equality fields, but the declared index does.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (q: any) => q.eq("modelId", modelId).eq("pricingType", pricingType),
      ).take(1);
      const [benchmarks, inputPrices, outputPrices, imagePrices, videoPrices, transcriptionPrices, speechPrices] = await Promise.all([
        ctx.db.query("benchmarkObservations").withIndex("by_model_metric", (q) => q.eq("modelId", modelId)).take(1),
        pricesFor("input_tokens"),
        pricesFor("output_tokens"),
        pricesFor("image_generation"),
        pricesFor("video_generation"),
        pricesFor("speech_transcription"),
        pricesFor("speech_generation"),
      ]);
      const current = await ctx.db.get(modelId);
      const hasInput = inputPrices.length > 0;
      const hasOutput = outputPrices.length > 0;
      const isImageGenerator = current?.capabilities.includes("image_generation") ?? false;
      const isVideoGenerator = current?.capabilities.includes("video_generation") ?? false;
      const isTranscriber = current?.capabilities.includes("speech_to_text") ?? false;
      const isSpeechGenerator = current?.capabilities.some((capability: string) => capability === "text_to_speech" || capability === "audio_generation") ?? false;
      const hasMediaPricing = isImageGenerator
        ? imagePrices.length > 0
        : isVideoGenerator
          ? videoPrices.length > 0
          : isTranscriber
            ? transcriptionPrices.length > 0
            : isSpeechGenerator
              ? speechPrices.length > 0
              : false;
      const isMediaModel = isImageGenerator || isVideoGenerator || isTranscriber || isSpeechGenerator;
      const isVerifiedProduct = Boolean(current?.accessOptions?.some((option: AccessOption) => option.accessMethod === "product") && current?.capabilityEvidence?.length);
      const hasRequiredContext = isVerifiedProduct || isMediaModel || Boolean(current?.contextWindow);
      const hasRequiredPricing = isVerifiedProduct || (isMediaModel ? hasMediaPricing : hasInput && hasOutput);
      const hasTaskEvidence = isVerifiedProduct || benchmarks.length > 0;
      const eligible = Boolean(current && !current.manualReviewRequired && current.active && current.modalities.length && hasRequiredContext && hasTaskEvidence && hasRequiredPricing);
      await ctx.db.patch(modelId, { status: current?.active === false ? "inactive" : eligible ? "eligible" : current?.manualReviewRequired ? "manual_review" : "pending_evidence" });
    }
    return { createdCount, updatedCount, recordsImported };
  },
});

export const backfillAiFirstMetadata = internalMutation({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query("canonicalModels").collect();
    let updated = 0;
    for (const model of models) {
      const metadata = aiNativeMetadata(model.name, model.capabilities);
      if (model.aiFirstClass && metadata.aiFirstClass !== "TRADITIONAL") continue;
      await ctx.db.patch(model._id, metadata);
      updated += 1;
    }
    return { updated };
  },
});

function latestBy<T extends { source: string; retrievedAt: number }>(items: T[], key: (item: T) => string) {
  const result = new Map<string, T>();
  for (const item of items.sort((a, b) => b.retrievedAt - a.retrievedAt)) {
    const identity = `${item.source}:${key(item)}`;
    if (!result.has(identity)) result.set(identity, item);
  }
  return [...result.values()];
}

async function readCatalog(ctx: QueryCtx) {
  const models = await ctx.db.query("canonicalModels").collect();
  return Promise.all(models.filter((model) => model.active && model.status === "eligible").map(async (model) => {
    const [benchmarks, prices, privacy, licenses] = await Promise.all([
      ctx.db.query("benchmarkObservations").withIndex("by_model_retrieved", (q) => q.eq("modelId", model._id)).order("desc").take(40),
      ctx.db.query("pricingObservations").withIndex("by_model_retrieved", (q) => q.eq("modelId", model._id)).order("desc").take(20),
      ctx.db.query("privacyObservations").withIndex("by_model", (q) => q.eq("modelId", model._id)).order("desc").take(4),
      ctx.db.query("licenseObservations").withIndex("by_model", (q) => q.eq("modelId", model._id)).order("desc").take(4),
    ]);
    const legacyAiMetadata = aiNativeMetadata(model.name, model.capabilities);
    return {
      ...legacyAiMetadata,
      ...model,
      aiFirstClass: legacyAiMetadata.aiFirstClass === "TRADITIONAL" ? legacyAiMetadata.aiFirstClass : model.aiFirstClass ?? legacyAiMetadata.aiFirstClass,
      aiRole: legacyAiMetadata.aiFirstClass === "TRADITIONAL" ? legacyAiMetadata.aiRole : model.aiRole ?? legacyAiMetadata.aiRole,
      aiContributionLevel: legacyAiMetadata.aiFirstClass === "TRADITIONAL" ? legacyAiMetadata.aiContributionLevel : model.aiContributionLevel ?? legacyAiMetadata.aiContributionLevel,
      automationLevel: legacyAiMetadata.aiFirstClass === "TRADITIONAL" ? legacyAiMetadata.automationLevel : model.automationLevel ?? legacyAiMetadata.automationLevel,
      requiredManualWork: legacyAiMetadata.aiFirstClass === "TRADITIONAL" ? legacyAiMetadata.requiredManualWork : model.requiredManualWork ?? legacyAiMetadata.requiredManualWork,
      accessOptions: (model.accessOptions ?? []).map(withAiAccessMetadata),
      benchmarks: latestBy(benchmarks, (item) => `${item.metric}:${item.modelVersion ?? ""}`),
      prices: latestBy(prices, (item) => `${item.pricingType}:${item.modelVersion ?? ""}`),
      privacy: latestBy(privacy, (item) => item.level),
      licenses: latestBy(licenses, (item) => String(item.commercialUse)),
    };
  }));
}

export const catalog = query({ args: {}, handler: async (ctx) => { await requireUser(ctx); return readCatalog(ctx); } });
export const catalogInternal = internalQuery({ args: {}, handler: async (ctx) => readCatalog(ctx) });
