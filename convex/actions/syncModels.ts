"use node";

import { actionGeneric as action, internalActionGeneric as internalAction, anyApi } from "convex/server";
import { v } from "convex/values";
import { ArtificialAnalysisAdapter, MmluProAdapter, OpenAiOfficialAdapter, OpenAsrAdapter, OpenRouterAdapter, OfficialProductsAdapter, type ModelSourceAdapter } from "../../lib/model-data/adapters";
import { NORMALIZER_VERSIONS, normalizeArtificialAnalysis, normalizeMmluPro, normalizeOpenAiOfficial, normalizeOpenAsr, normalizeOpenRouter, normalizeOfficialProducts } from "../../lib/model-data/normalizers";
import type { SourceId } from "../../lib/model-data/source-registry";
import { affectedTaskCategories } from "../../lib/recommendation/taxonomy";
import { requireIdentity } from "../lib/auth";

const sourceValidator = v.union(v.literal("artificial_analysis"), v.literal("openrouter"), v.literal("mmlu_pro"), v.literal("open_asr"), v.literal("openai_official"), v.literal("official_products"));
const INGEST_BATCH_SIZE = 100;

function adapterFor(source: SourceId): ModelSourceAdapter {
  if (source === "artificial_analysis") return new ArtificialAnalysisAdapter(process.env.ARTIFICIAL_ANALYSIS_API_KEY ?? "", "https://artificialanalysis.ai/api/v2", process.env.GEMINI_API_KEY ?? "");
  if (source === "openrouter") return new OpenRouterAdapter(process.env.OPENROUTER_API_KEY ?? "");
  if (source === "mmlu_pro") return new MmluProAdapter();
  if (source === "open_asr") return new OpenAsrAdapter();
  if (source === "official_products") return new OfficialProductsAdapter();
  return new OpenAiOfficialAdapter();
}

// Convex does not expose a shared typed action context for generic server functions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runSync(ctx: any, source: SourceId) {
  const runId = await ctx.runMutation(anyApi.modelSync.startRun, { source });
  try {
    const result = await adapterFor(source).fetchSnapshot();
    const previous = await ctx.runQuery(anyApi.modelSync.latestValidSnapshot, { source });
    const normalizerVersion = NORMALIZER_VERSIONS[source];
    if (previous?.payloadHash === result.payloadHash && previous.metadata?.normalizerVersion === normalizerVersion) return await ctx.runMutation(anyApi.modelSync.completeUnchanged, { runId, snapshotId: previous._id });
    const models = source === "artificial_analysis"
      ? normalizeArtificialAnalysis(result.payload, result.fetchedAt, result.sourceVersion)
      : source === "openrouter"
        ? normalizeOpenRouter(result.payload, result.fetchedAt, result.sourceVersion)
        : source === "mmlu_pro"
          ? normalizeMmluPro(result.payload, result.fetchedAt, result.sourceVersion)
          : source === "open_asr"
            ? normalizeOpenAsr(result.payload, result.fetchedAt, result.sourceVersion)
            : source === "official_products"
              ? normalizeOfficialProducts(result.payload, result.fetchedAt)
              : normalizeOpenAiOfficial(result.payload, result.fetchedAt, result.sourceVersion);
    const counts = { createdCount: 0, updatedCount: 0, recordsImported: 0 };
    for (let index = 0; index < models.length; index += INGEST_BATCH_SIZE) {
      const batchCounts = await ctx.runMutation(anyApi.models.ingest, {
        source,
        retrievedAt: result.fetchedAt,
        models: models.slice(index, index + INGEST_BATCH_SIZE),
      });
      counts.createdCount += batchCounts.createdCount;
      counts.updatedCount += batchCounts.updatedCount;
      counts.recordsImported += batchCounts.recordsImported;
    }
    const snapshotId = await ctx.runMutation(anyApi.modelSync.saveSnapshot, {
      runId, source, sourceUrl: result.sourceUrl, attribution: result.attribution, rawPayload: result.payload, payloadHash: result.payloadHash,
      fetchedAt: result.fetchedAt, sourceVersion: result.sourceVersion, metadata: { ...result.metadata, normalizerVersion }, ...counts,
    });
    const categories = affectedTaskCategories(models.flatMap((model) => model.capabilities), models.flatMap((model) => model.benchmarks.map((benchmark) => benchmark.category).filter((category): category is string => Boolean(category))));
    await ctx.runMutation(anyApi.strategies.queueEvidenceRefreshes, { source, snapshotId, categories });
    await ctx.scheduler.runAfter(0, anyApi.actions.recommend.reEvaluatePending, {});
    return snapshotId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync failure";
    await ctx.runMutation(anyApi.modelSync.failRun, { runId, error: message });
    throw new Error(message);
  }
}

export const syncSource = internalAction({ args: { source: sourceValidator }, handler: async (ctx, { source }) => runSync(ctx, source) });

export const syncNow = action({ args: { source: sourceValidator }, handler: async (ctx, { source }) => {
  await requireIdentity(ctx);
  await ctx.runQuery(anyApi.modelSync.assertAdmin, {});
  return runSync(ctx, source);
} });
