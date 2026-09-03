import { internalMutationGeneric as internalMutation, internalQueryGeneric as internalQuery, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { EVIDENCE_SOURCES } from "../lib/model-data/source-registry";
import { aiAccessMetadata, aiNativeMetadata, isAiFirstEligible } from "../lib/recommendation/ai-first";
import { effectiveModelCapabilities } from "../lib/recommendation/taxonomy";
import type { Doc } from "./_generated/dataModel";
import { isEvidenceAdminEmail, requireAdmin, requireUser } from "./lib/auth";

type DiagnosticsAccessOption = {
  label: string;
  productName?: string;
  accessMethod?: "product" | "api" | "marketplace" | "cloud";
  aiFirstClass?: "AI_NATIVE" | "AI_CENTRIC" | "AI_ASSISTED" | "TRADITIONAL";
  aiRole?: string;
  aiContributionLevel?: "LOW" | "MEDIUM" | "HIGH";
  automationLevel?: "LOW" | "MEDIUM" | "HIGH";
  requiredManualWork?: string;
};

function catalogCoverage(models: Array<Doc<"canonicalModels">>) {
  const recommendableModels = models.filter((model) => {
    const modelMetadata = model.aiFirstClass ? model : { ...model, ...aiNativeMetadata(model.name, model.capabilities) };
    const hasAiFirstAccess = (model.accessOptions ?? []).some((option: DiagnosticsAccessOption) => isAiFirstEligible({
      ...aiAccessMetadata(option.productName ?? option.label, option.accessMethod),
      ...option,
    }));
    return model.active && model.status === "eligible" && isAiFirstEligible(modelMetadata) && hasAiFirstAccess;
  });
  const capabilityCount = (...targets: string[]) => recommendableModels.filter((model) => {
    const capabilities = effectiveModelCapabilities({
      capabilities: model.capabilities,
      modalities: model.modalities,
      contextWindow: model.contextWindow ?? null,
    });
    return targets.some((target) => capabilities.includes(target as never));
  }).length;
  return {
    counts: {
      total: models.length,
      eligible: models.filter((model) => model.status === "eligible").length,
      pending: models.filter((model) => model.status === "pending_evidence").length,
      manualReview: models.filter((model) => model.status === "manual_review").length,
      providers: new Set(models.map((model) => model.provider)).size,
      withVerifiedAccess: models.filter((model) => (model.accessOptions ?? []).length > 0).length,
      recommendableNow: recommendableModels.length,
    },
    capabilityCounts: {
      textAndReasoning: capabilityCount("text_generation", "reasoning"),
      codingAndAgents: capabilityCount("coding", "repository_editing", "agentic_execution", "tool_use"),
      researchAndDocuments: capabilityCount("web_research", "document_parsing", "long_context"),
      image: capabilityCount("image_generation", "image_understanding"),
      video: capabilityCount("video_generation", "video_editing"),
      audioAndSpeech: capabilityCount("audio_generation", "speech_to_text", "text_to_speech"),
      designAndPresentations: capabilityCount("ui_generation", "presentation_generation"),
    },
    aiFirstCounts: {
      native: models.filter((model) => model.aiFirstClass === "AI_NATIVE").length,
      centric: models.filter((model) => model.aiFirstClass === "AI_CENTRIC").length,
      assisted: models.filter((model) => model.aiFirstClass === "AI_ASSISTED").length,
      traditional: models.filter((model) => model.aiFirstClass === "TRADITIONAL").length,
      unclassified: models.filter((model) => !model.aiFirstClass).length,
    },
  };
}

export const latestValidSnapshot = internalQuery({ args: { source: v.string() }, handler: async (ctx, { source }) => {
  const snapshots = await ctx.db.query("dataSnapshots").withIndex("by_source", (q) => q.eq("source", source)).order("desc").take(10);
  return snapshots.find((item) => item.valid) ?? null;
} });

export const latestValidSnapshots = internalQuery({ args: {}, handler: async (ctx) => {
  const results = [];
  for (const source of EVIDENCE_SOURCES.filter((item) => item.supported)) {
    const snapshots = await ctx.db.query("dataSnapshots").withIndex("by_source", (q) => q.eq("source", source.id)).order("desc").take(10);
    const snapshot = snapshots.find((item) => item.valid);
    if (snapshot) results.push(snapshot);
  }
  return results;
} });

export const startRun = internalMutation({ args: { source: v.string() }, handler: async (ctx, { source }) => ctx.db.insert("syncRuns", { source, status: "running", createdCount: 0, updatedCount: 0, failedCount: 0, recordsImported: 0, startedAt: Date.now() }) });

export const saveSnapshot = internalMutation({
  args: {
    runId: v.id("syncRuns"), source: v.string(), sourceUrl: v.optional(v.string()), attribution: v.optional(v.string()), rawPayload: v.any(), payloadHash: v.string(),
    fetchedAt: v.number(), sourceVersion: v.optional(v.string()), metadata: v.optional(v.any()), createdCount: v.optional(v.number()), updatedCount: v.optional(v.number()), recordsImported: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("dataSnapshots", { source: args.source, sourceUrl: args.sourceUrl, attribution: args.attribution, rawPayload: args.rawPayload, payloadHash: args.payloadHash, fetchedAt: args.fetchedAt, valid: true, sourceVersion: args.sourceVersion, metadata: args.metadata });
    await ctx.db.patch(args.runId, { status: "complete", completedAt: Date.now(), createdCount: args.createdCount ?? 0, updatedCount: args.updatedCount ?? 0, recordsImported: args.recordsImported ?? 0, snapshotId: id, unchanged: false });
    return id;
  },
});

export const completeUnchanged = internalMutation({ args: { runId: v.id("syncRuns"), snapshotId: v.id("dataSnapshots") }, handler: async (ctx, { runId, snapshotId }) => {
  const previous = await ctx.db.get(snapshotId);
  if (!previous) throw new Error("Previous evidence snapshot was not found");
  const fetchedAt = Date.now();
  const revalidatedSnapshotId = await ctx.db.insert("dataSnapshots", {
    source: previous.source,
    sourceUrl: previous.sourceUrl,
    rawPayload: previous.rawPayload,
    payloadHash: previous.payloadHash,
    fetchedAt,
    valid: true,
    attribution: previous.attribution,
    sourceVersion: previous.sourceVersion,
    metadata: { ...(previous.metadata ?? {}), revalidatedFrom: String(snapshotId) },
  });
  await ctx.db.patch(runId, { status: "complete", completedAt: fetchedAt, unchanged: true, snapshotId: revalidatedSnapshotId });
  return revalidatedSnapshotId;
} });

export const failRun = internalMutation({ args: { runId: v.id("syncRuns"), error: v.string() }, handler: async (ctx, { runId, error }) => ctx.db.patch(runId, { status: "failed", completedAt: Date.now(), failedCount: 1, error }) });

export const assertAdmin = internalQuery({ args: {}, handler: async (ctx) => { const user = await requireAdmin(ctx); return { id: user._id, email: user.email }; } });

export const diagnostics = query({ args: {}, handler: async (ctx) => {
  await requireAdmin(ctx);
  const models = await ctx.db.query("canonicalModels").collect();
  const [successfulPlannerRuns, failedPlannerRuns] = await Promise.all([
    ctx.db.query("plannerRuns").withIndex("by_status", (q) => q.eq("status", "success")).order("desc").take(1),
    ctx.db.query("plannerRuns").withIndex("by_status", (q) => q.eq("status", "failed")).order("desc").take(1),
  ]);
  const sources = [];
  for (const definition of EVIDENCE_SOURCES) {
    const runs = await ctx.db.query("syncRuns").withIndex("by_source", (q) => q.eq("source", definition.id)).order("desc").take(10);
    const snapshots = await ctx.db.query("dataSnapshots").withIndex("by_source", (q) => q.eq("source", definition.id)).order("desc").take(1);
    sources.push({ ...definition, latestRun: runs[0] ?? null, recentRuns: runs, latestSnapshot: snapshots[0] ?? null });
  }
  const coverage = catalogCoverage(models);
  return {
    sources,
    planner: {
      name: "Planner AI",
      configured: process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_PLANNER_MODEL?.trim()
        ? Boolean(process.env.GEMINI_API_KEY?.trim() && process.env.GEMINI_PLANNER_MODEL?.trim())
        : Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_PLANNER_MODEL?.trim()),
      provider: process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_PLANNER_MODEL?.trim() ? "Google Gemini" : "OpenAI",
      model: (process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_PLANNER_MODEL?.trim()
        ? process.env.GEMINI_PLANNER_MODEL
        : process.env.OPENAI_PLANNER_MODEL)?.trim() || null,
      lastSuccessfulAnalysis: successfulPlannerRuns[0]?.completedAt ?? null,
      lastError: failedPlannerRuns[0] ? { at: failedPlannerRuns[0].completedAt ?? failedPlannerRuns[0].startedAt, code: failedPlannerRuns[0].errorCode ?? "PLANNER_FAILED", message: failedPlannerRuns[0].errorMessage ?? "Planner analysis failed" } : null,
    },
    manualReviewModels: models.filter((model) => model.status === "manual_review").slice(0, 100).map((model) => ({ id: model._id, canonicalId: model.canonicalId, name: model.name, provider: model.provider, aliases: model.aliases ?? [], updatedAt: model.updatedAt })),
    ...coverage,
  };
} });

export const coverageInternal = internalQuery({ args: {}, handler: async (ctx) => catalogCoverage(await ctx.db.query("canonicalModels").collect()) });

export const adminStatus = query({ args: {}, handler: async (ctx) => {
  const user = await requireUser(ctx);
  return { isAdmin: isEvidenceAdminEmail(user.email) };
} });
