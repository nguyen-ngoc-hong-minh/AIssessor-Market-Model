/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import schema from "@/convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");

describe("Convex identity and authorization", () => {
  it("creates a Clerk-backed user and stores stakeholder onboarding without passwords", async () => {
    const t = convexTest({ schema, modules });
    const alice = t.withIdentity({ subject: "user_alice", email: "alice@example.com", name: "Alice" });
    await alice.mutation(anyApi.users.ensureCurrent, {});
    await alice.mutation(anyApi.profiles.completeOnboarding, { accountType: "individual", profession: "Research", industry: "Technology", country: "Vietnam", preferredLanguage: "English" });
    const users = await t.run((ctx) => ctx.db.query("users").collect());
    expect(users).toHaveLength(1); expect(users[0]).toMatchObject({ clerkUserId: "user_alice", email: "alice@example.com", onboardingComplete: true }); expect(users[0]).not.toHaveProperty("password");
  });
  it("prevents one Clerk user from reading another user's strategy", async () => {
    const t = convexTest({ schema, modules }); const alice = t.withIdentity({ subject: "user_alice", email: "alice@example.com" }); const bob = t.withIdentity({ subject: "user_bob", email: "bob@example.com" });
    await alice.mutation(anyApi.users.ensureCurrent, {}); await bob.mutation(anyApi.users.ensureCurrent, {});
    const strategyId = await alice.mutation(anyApi.strategies.create, { usageType: "one_off", title: "Private", originalInput: "Private project details", expectedResult: "A report", priorities: ["balanced"] });
    await expect(bob.query(anyApi.strategies.getOwned, { strategyId })).rejects.toThrow("Not found");
  });
  it("stores planner output as an unapproved workflow draft", async () => {
    const t = convexTest({ schema, modules });
    const user = t.withIdentity({ subject: "planner_user", email: "planner@example.com" });
    await user.mutation(anyApi.users.ensureCurrent, {});
    const strategyId = await user.mutation(anyApi.strategies.create, { usageType: "one_off", title: "Draft", originalInput: "Create a researched report", expectedResult: "Report", priorities: ["balanced"] });
    await user.mutation(anyApi.strategies.replaceWorkflow, { strategyId, steps: [{ order: 0, name: "Research", description: "Gather current sources", requirements: { requiredModalities: ["text"] }, estimates: { requests: 3 } }] });
    const owned = await user.query(anyApi.strategies.getOwned, { strategyId });
    expect(owned.strategy.status).toBe("planned");
    expect(owned.steps).toHaveLength(1);
    expect(owned.steps[0].approved).toBe(false);
  });
  it("blocks recommendation generation before workflow approval", async () => {
    const t = convexTest({ schema, modules });
    const user = t.withIdentity({ subject: "recommend_user", email: "recommend@example.com" });
    await user.mutation(anyApi.users.ensureCurrent, {});
    const strategyId = await user.mutation(anyApi.strategies.create, { usageType: "one_off", title: "Draft", originalInput: "Create a researched report", expectedResult: "Report", priorities: ["balanced"] });
    await expect(user.action(anyApi.actions.recommend.generate, { strategyId, region: "global" })).rejects.toMatchObject({ data: { code: "WORKFLOW_NOT_APPROVED" } });
  });
  it("persists generated plans for free users and loads them on revisit", async () => {
    const t = convexTest({ schema, modules });
    const user = t.withIdentity({ subject: "saved_plan_user", email: "saved@example.com" });
    await user.mutation(anyApi.users.ensureCurrent, {});
    const strategyId = await user.mutation(anyApi.strategies.create, { usageType: "monthly", title: "Saved monthly work", originalInput: "Research weekly", expectedResult: "A recurring AI stack", priorities: ["balanced"] });
    const snapshotId = await t.run((ctx) => ctx.db.insert("dataSnapshots", { source: "official_products", rawPayload: {}, payloadHash: "saved-hash", fetchedAt: 500, valid: true }));
    const plan = { variant: "recommended", steps: [], fixedCostUsd: 20, apiCostUsd: 1, totalCostUsd: 21, estimatedSavingsUsd: 0, existingSubscriptions: { kept: [], couldCancel: [] }, subscriptions: [], uniqueProductCount: 1, completeStepCount: 0, budgetUsd: null, overBudgetUsd: 0, hasUnknownSubscriptionPricing: false, assumptions: [], dataUpdatedAt: 500 };
    await t.mutation(anyApi.strategies.saveGeneratedPlans, { strategyId, dataSnapshotId: snapshotId, dataSnapshotSummary: [{ id: snapshotId, source: "official_products", fetchedAt: 500 }], plans: [plan] });
    const planRecords = await t.run((ctx) => ctx.db.query("strategyPlans").collect());
    expect(planRecords[0].recommendations).toEqual([]);
    expect(planRecords[0].fullPlan).toEqual(plan);
    const [owned, stored] = await Promise.all([
      user.query(anyApi.strategies.getOwned, { strategyId }),
      user.action(anyApi.actions.recommend.loadSaved, { strategyId }),
    ]);
    expect(owned.strategy.status).toBe("complete");
    expect(stored).toMatchObject({ locked: true, usageType: "monthly", plans: [{ variant: "recommended", totalCostUsd: 21 }], dataSnapshot: { fetchedAt: 500 } });
  });
  it("processes Clerk webhooks idempotently and revokes access after deletion", async () => {
    process.env.CLERK_WEBHOOK_SYNC_KEY = "sync-test"; const t = convexTest({ schema, modules });
    const created = { syncKey: "sync-test", eventId: "evt-1", eventType: "user.created", clerkUserId: "user_webhook", email: "webhook@example.com", displayName: "Webhook User" } as const;
    expect(await t.mutation(anyApi.users.syncFromClerkWebhook, created)).toEqual({ duplicate: false });
    expect(await t.mutation(anyApi.users.syncFromClerkWebhook, created)).toEqual({ duplicate: true });
    await t.mutation(anyApi.users.syncFromClerkWebhook, { syncKey: "sync-test", eventId: "evt-2", eventType: "user.deleted", clerkUserId: "user_webhook" });
    const deleted = t.withIdentity({ subject: "user_webhook", email: "webhook@example.com" });
    await expect(deleted.query(anyApi.users.current, {})).rejects.toThrow("not synchronized");
  });
  it("stores only valid dated source snapshots", async () => {
    const t = convexTest({ schema, modules });
    const runId = await t.run((ctx) => ctx.db.insert("syncRuns", { source: "openrouter", status: "running", createdCount: 0, updatedCount: 0, failedCount: 0, startedAt: 100 }));
    await t.mutation(anyApi.modelSync.saveSnapshot, { runId, source: "openrouter", sourceUrl: "https://openrouter.ai/api/v1/models", rawPayload: { data: [] }, payloadHash: "hash", fetchedAt: 100 });
    const snapshots = await t.run((ctx) => ctx.db.query("dataSnapshots").collect());
    expect(snapshots[0]).toMatchObject({ source: "openrouter", valid: true, fetchedAt: 100 });
  });
  it("records an unchanged run as a fresh immutable revalidation snapshot", async () => {
    const t = convexTest({ schema, modules });
    const firstRun = await t.run((ctx) => ctx.db.insert("syncRuns", { source: "openrouter", status: "running", createdCount: 0, updatedCount: 0, failedCount: 0, startedAt: 100 }));
    const snapshotId = await t.mutation(anyApi.modelSync.saveSnapshot, { runId: firstRun, source: "openrouter", rawPayload: { data: [] }, payloadHash: "same", fetchedAt: 100 });
    const secondRun = await t.run((ctx) => ctx.db.insert("syncRuns", { source: "openrouter", status: "running", createdCount: 0, updatedCount: 0, failedCount: 0, startedAt: 200 }));
    await t.mutation(anyApi.modelSync.completeUnchanged, { runId: secondRun, snapshotId });
    const [snapshots, run] = await Promise.all([t.run((ctx) => ctx.db.query("dataSnapshots").collect()), t.run((ctx) => ctx.db.get(secondRun))]);
    expect(snapshots).toHaveLength(2);
    expect(run).toMatchObject({ status: "complete", unchanged: true });
    expect(run?.snapshotId).not.toBe(snapshotId);
    expect(snapshots.find((item) => item._id === run?.snapshotId)?.fetchedAt).toBeGreaterThan(100);
  });
  it("merges independent source facts before making a canonical model eligible", async () => {
    const t = convexTest({ schema, modules });
    const user = t.withIdentity({ subject: "evidence_user", email: "evidence@example.com" });
    await user.mutation(anyApi.users.ensureCurrent, {});
    const base = {
      canonicalId: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", aliases: ["openai/gpt-4o", "gpt-4o"],
      active: true, status: "pending_evidence" as const, mappingConfidence: "exact" as const, manualReviewRequired: false, regions: [], licenses: [],
      accessOptions: [{ label: "View on OpenRouter", url: "https://openrouter.ai/openai/gpt-4o", modelId: "openai/gpt-4o", sourceUrl: "https://openrouter.ai/api/v1/models", verifiedAt: 100 }],
    };
    await t.mutation(anyApi.models.ingest, { source: "openrouter", retrievedAt: 100, models: [{ ...base, modalities: ["text", "image"], capabilities: ["structured_outputs"], contextWindow: 128000, benchmarks: [], privacy: [], prices: [{ pricingType: "input_tokens", amount: 2.5, unit: "1m_tokens", currency: "USD", effectiveAt: 100 }, { pricingType: "output_tokens", amount: 10, unit: "1m_tokens", currency: "USD", effectiveAt: 100 }] }] });
    expect(await user.query(anyApi.models.catalog, {})).toHaveLength(0);
    await t.mutation(anyApi.models.ingest, { source: "mmlu_pro", retrievedAt: 200, models: [{ ...base, modalities: [], capabilities: [], benchmarks: [{ metric: "mmlu_pro_overall", score: .72, normalizedValue: 72, category: "general", measuredAt: 200, confidence: "official_dataset" }], prices: [], privacy: [] }] });
    await t.mutation(anyApi.models.ingest, { source: "openai_official", retrievedAt: 300, models: [{ ...base, modalities: ["text", "image"], capabilities: ["structured_outputs"], contextWindow: 128000, benchmarks: [], prices: [], privacy: [{ level: "standard", sourceUrl: "https://developers.openai.com/api/docs/guides/your-data", confidence: "official_provider_docs" }] }] });
    const catalog = await user.query(anyApi.models.catalog, {});
    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({ canonicalId: "openai/gpt-4o", status: "eligible", contextWindow: 128000 });
    expect(catalog[0].benchmarks[0]).toMatchObject({ source: "mmlu_pro", category: "general" });
    expect(catalog[0].privacy[0]).toMatchObject({ source: "openai_official", level: "standard" });
  });
  it("reconciles an exact Artificial Analysis media family with its runnable OpenRouter model", async () => {
    const t = convexTest({ schema, modules });
    const user = t.withIdentity({ subject: "media_user", email: "media@example.com" });
    await user.mutation(anyApi.users.ensureCurrent, {});
    const shared = { active: true, status: "pending_evidence" as const, mappingConfidence: "exact" as const, manualReviewRequired: false, regions: [], privacy: [], licenses: [] };
    await t.mutation(anyApi.models.ingest, { source: "openrouter", retrievedAt: 100, models: [{ ...shared, canonicalId: "openai/gpt-image-2", name: "OpenAI: GPT Image 2", provider: "openai", aliases: ["openai/gpt-image-2"], modalities: ["text", "image"], capabilities: ["image_generation"], accessOptions: [{ label: "Open on OpenRouter", url: "https://openrouter.ai/openai/gpt-image-2", modelId: "openai/gpt-image-2", sourceUrl: "https://openrouter.ai/api/v1/models", verifiedAt: 100 }], benchmarks: [], prices: [{ pricingType: "image_generation", amount: 40, unit: "1k_images", currency: "USD", effectiveAt: 100 }] }] });
    await t.mutation(anyApi.models.ingest, { source: "artificial_analysis", retrievedAt: 200, models: [{ ...shared, canonicalId: "artificial-analysis/image/gpt-image-2-high", name: "GPT Image 2 (high)", provider: "OpenAI", aliases: ["GPT Image 2 (high)"], modalities: ["text", "image"], capabilities: ["image_generation"], accessOptions: [], benchmarks: [{ metric: "artificial_analysis_image_arena_elo", score: 1300, normalizedValue: 99, category: "image", measuredAt: 200, confidence: "official_dataset" }], prices: [{ pricingType: "image_generation", amount: 42, unit: "1k_images", currency: "USD", effectiveAt: 200 }] }] });
    const catalog = await user.query(anyApi.models.catalog, {});
    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({ canonicalId: "openai/gpt-image-2", status: "eligible" });
    expect(catalog[0].accessOptions?.[0].modelId).toBe("openai/gpt-image-2");
    expect(catalog[0].benchmarks[0]).toMatchObject({ source: "artificial_analysis", category: "image" });
  });
  it("merges Open ASR quality with OpenRouter access and minute pricing", async () => {
    const t = convexTest({ schema, modules });
    const user = t.withIdentity({ subject: "speech_user", email: "speech@example.com" });
    await user.mutation(anyApi.users.ensureCurrent, {});
    const shared = { canonicalId: "openai/whisper-large-v3", name: "Whisper Large V3", provider: "openai", aliases: ["openai/whisper-large-v3"], active: true, status: "pending_evidence" as const, mappingConfidence: "exact" as const, manualReviewRequired: false, regions: [], privacy: [], licenses: [] };
    await t.mutation(anyApi.models.ingest, { source: "openrouter", retrievedAt: 100, models: [{ ...shared, modalities: ["audio", "transcription"], capabilities: ["speech_to_text"], accessOptions: [{ label: "Open on OpenRouter", url: "https://openrouter.ai/openai/whisper-large-v3", modelId: "openai/whisper-large-v3", sourceUrl: "https://openrouter.ai/api/v1/models", verifiedAt: 100 }], benchmarks: [], prices: [{ pricingType: "speech_transcription", amount: .0045, unit: "minute", currency: "USD", effectiveAt: 100 }] }] });
    expect(await user.query(anyApi.models.catalog, {})).toHaveLength(0);
    await t.mutation(anyApi.models.ingest, { source: "open_asr", retrievedAt: 200, models: [{ ...shared, modalities: ["audio", "transcription"], capabilities: ["speech_to_text"], accessOptions: [], benchmarks: [{ metric: "open_asr_average_cleaned_wer", score: 6.5, normalizedValue: 90, category: "transcription", measuredAt: 200, confidence: "official_dataset" }], prices: [] }] });
    const [speech] = await user.query(anyApi.models.catalog, {});
    expect(speech).toMatchObject({ canonicalId: "openai/whisper-large-v3", status: "eligible" });
    expect(speech.prices[0]).toMatchObject({ pricingType: "speech_transcription", amount: .0045 });
    expect(speech.benchmarks[0]).toMatchObject({ source: "open_asr", category: "transcription" });
  });
  it("makes an AI-native product eligible from official capability evidence without API token pricing", async () => {
    const t = convexTest({ schema, modules });
    const user = t.withIdentity({ subject: "product_user", email: "product@example.com" });
    await user.mutation(anyApi.users.ensureCurrent, {});
    await t.mutation(anyApi.models.ingest, { source: "official_products", retrievedAt: 100, models: [{
      canonicalId: "openai/codex-product", name: "OpenAI Codex", provider: "OpenAI", aliases: ["OpenAI Codex"], modalities: ["text"], capabilities: ["coding", "repository_editing", "test_generation"],
      aiFirstClass: "AI_NATIVE", aiRole: "AI coding agent", aiContributionLevel: "HIGH", automationLevel: "HIGH", requiredManualWork: "Review changes",
      active: true, status: "eligible", mappingConfidence: "exact", manualReviewRequired: false, regions: [],
      accessOptions: [{ label: "Open Codex", url: "https://chatgpt.com/codex", modelId: "openai/codex-product", sourceUrl: "https://developers.openai.com/", verifiedAt: 100, productId: "openai/codex-product", productName: "OpenAI Codex", planName: "ChatGPT plan or API usage", accessMethod: "product", aiFirstClass: "AI_NATIVE", aiContributionLevel: "HIGH", automationLevel: "HIGH" }],
      capabilityEvidence: [{ capabilities: ["coding", "repository_editing", "test_generation"], category: "software_engineering", sourceUrl: "https://developers.openai.com/", verifiedAt: 100, confidence: "official_provider_docs" }],
      benchmarks: [], prices: [], privacy: [], licenses: [],
    }] });
    const [product] = await user.query(anyApi.models.catalog, {});
    expect(product).toMatchObject({ canonicalId: "openai/codex-product", status: "eligible" });
    expect(product.capabilityEvidence[0].capabilities).toContain("test_generation");
  });
  it("upserts recurring evidence observations instead of growing duplicate history", async () => {
    const t = convexTest({ schema, modules });
    const model = { canonicalId: "lab/repeat", name: "Repeat", provider: "lab", aliases: ["lab/repeat"], active: true, status: "pending_evidence" as const, mappingConfidence: "exact" as const, manualReviewRequired: false, regions: [], modalities: ["text"], capabilities: ["text_generation"], contextWindow: 1000, accessOptions: [], prices: [], privacy: [], licenses: [], benchmarks: [{ metric: "quality", score: 70, category: "general", measuredAt: 100, confidence: "official_dataset" }] };
    await t.mutation(anyApi.models.ingest, { source: "benchmark", retrievedAt: 100, models: [model] });
    await t.mutation(anyApi.models.ingest, { source: "benchmark", retrievedAt: 200, models: [{ ...model, benchmarks: [{ ...model.benchmarks[0], score: 75, measuredAt: 200 }] }] });
    const observations = await t.run((ctx) => ctx.db.query("benchmarkObservations").collect());
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({ score: 75, retrievedAt: 200 });
  });
  it("forces known conventional software to remain traditional even when imported with an incorrect label", async () => {
    const t = convexTest({ schema, modules });
    const user = t.withIdentity({ subject: "ai_first_user", email: "ai-first@example.com" });
    await user.mutation(anyApi.users.ensureCurrent, {});
    await t.mutation(anyApi.models.ingest, { source: "manual", retrievedAt: 100, models: [{
      canonicalId: "adobe/premiere-pro", name: "Adobe Premiere Pro", provider: "Adobe", aliases: ["Premiere Pro"], modalities: ["text"], capabilities: ["text_generation"], contextWindow: 100000,
      aiFirstClass: "AI_NATIVE", aiRole: "Incorrect import", aiContributionLevel: "HIGH", automationLevel: "HIGH", requiredManualWork: "None",
      active: true, status: "pending_evidence", mappingConfidence: "exact", manualReviewRequired: false, regions: [],
      accessOptions: [{ label: "Adobe Premiere Pro", url: "https://example.com/premiere", modelId: "premiere", sourceUrl: "https://example.com", verifiedAt: 100, productName: "Adobe Premiere Pro", accessMethod: "product", aiFirstClass: "AI_NATIVE", aiContributionLevel: "HIGH", automationLevel: "HIGH" }],
      benchmarks: [{ metric: "writing", score: 80, normalizedValue: 80, category: "writing", measuredAt: 100, confidence: "manual" }],
      prices: [{ pricingType: "input_tokens", amount: 1, unit: "1m_tokens", currency: "USD", effectiveAt: 100 }, { pricingType: "output_tokens", amount: 1, unit: "1m_tokens", currency: "USD", effectiveAt: 100 }], privacy: [], licenses: [],
    }] });
    const [record] = await user.query(anyApi.models.catalog, {});
    expect(record).toMatchObject({ aiFirstClass: "TRADITIONAL", aiContributionLevel: "LOW", automationLevel: "LOW" });
    expect(record.accessOptions?.[0]).toMatchObject({ aiFirstClass: "TRADITIONAL", aiContributionLevel: "LOW", automationLevel: "LOW" });
  });
});
