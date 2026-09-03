import { describe, expect, it } from "vitest";
import { generateStrategyPlan, taskCategory } from "@/lib/recommendation/engine";
import type { WorkflowStep, Priority } from "@/lib/planner/schema";
import type { CanonicalModel, EvidenceReference, StrategyVariant } from "@/lib/recommendation/types";

const now = 2_000_000_000_000;
const priorities: Priority[] = ["balanced", "lowest_cost", "highest_quality", "fastest", "privacy", "existing_tools"];
const variants: StrategyVariant[] = ["recommended", "lowest_cost", "highest_quality"];

function step(id: string, name: string, description: string, capabilities: string[], modalities: WorkflowStep["requiredModalities"] = ["text"]): WorkflowStep {
  return {
    id, order: Number(id.replace(/\D/g, "")) || 0, name, plainLanguageDescription: description, inputDescription: "User files and brief", outputDescription: `${name} output`, dependencies: [], canRunInParallel: false,
    estimatedInputTokensLow: 1_000, estimatedInputTokensExpected: 2_000, estimatedInputTokensHigh: 4_000, estimatedOutputTokensLow: 500, estimatedOutputTokensExpected: 1_000, estimatedOutputTokensHigh: 2_000,
    estimatedRequestCount: 2, estimatedImageCount: capabilities.includes("image_generation") ? 8 : 0, estimatedAudioMinutes: capabilities.some((item) => ["text_to_speech", "audio_generation", "speech_to_text"].includes(item)) ? 2 : 0,
    estimatedVideoMinutes: capabilities.some((item) => ["video_generation", "video_editing"].includes(item)) ? 1 : 0, requiredModalities: modalities, requiredCapabilities: capabilities,
    requiresCurrentInformation: capabilities.includes("web_research"), privacyRequirement: "business", commercialUseRequired: true, minimumQuality: "good", importance: "high", noAIEligible: false,
    noAIAlternative: "Complete manually", humanReviewRecommended: true, assumptions: [],
  };
}

function evidence(category: string, modelId: string): EvidenceReference[] {
  return [
    { kind: "benchmark", source: `${category} benchmark`, sourceUrl: `https://evidence.example/${category}`, retrievedAt: now, modelVersion: modelId, metricName: `${category}_quality`, rawValue: 82, normalizedValue: 82, category, confidence: "official_dataset", notes: null },
    { kind: "pricing", source: "Official pricing", sourceUrl: "https://evidence.example/pricing", retrievedAt: now, modelVersion: modelId, metricName: "input_tokens", rawValue: 1, normalizedValue: null, category: "cost", confidence: "official_provider_docs", notes: null },
    { kind: "privacy", source: "Official privacy", sourceUrl: "https://evidence.example/privacy", retrievedAt: now, modelVersion: modelId, metricName: "privacy_level", rawValue: "business", normalizedValue: null, category: "privacy", confidence: "official_provider_docs", notes: null },
  ];
}

function model(id: string, name: string, category: string, capabilities: string[], modalities = ["text"], product = name): CanonicalModel {
  const aiFirst = { aiFirstClass: "AI_NATIVE" as const, aiRole: `Uses AI to perform ${capabilities.join(", ")}`, aiContributionLevel: "HIGH" as const, automationLevel: "HIGH" as const, requiredManualWork: "Review and refinement" };
  return {
    ...aiFirst,
    id, canonicalId: `test/${id}`, name, provider: "Test Provider", active: true, modalities, capabilities, contextWindow: 200_000,
    inputPricePerMillion: 1, outputPricePerMillion: 3, imagePricePerThousand: 30, videoPricePerMinute: 2, audioPricePerMinute: .01, speechPricePerMillionCharacters: 15, qualityScore: 82, outputTokensPerSecond: 120,
    privacyLevel: "business", commercialUse: true, regions: ["global"], source: `${category} benchmark`, measuredAt: now, retrievedAt: now, existingTool: false,
    evidence: evidence(category, id), mappingConfidence: "exact",
    accessOptions: [{ ...aiFirst, label: `Open ${product}`, url: `https://tools.example/${id}`, modelId: id, sourceUrl: "https://tools.example/catalog", verifiedAt: now, productId: product.toLowerCase().replaceAll(" ", "-"), productName: product, planName: "Usage based API", accessMethod: "api" }],
  };
}

function assertCompletePlans(steps: WorkflowStep[], models: CanonicalModel[]) {
  const plans = variants.map((variant) => generateStrategyPlan(steps, models, { priorities, budgetUsd: 500, region: "global", now, existingTools: [] }, variant));
  for (const plan of plans) {
    expect(plan.completeStepCount).toBe(steps.length);
    expect(plan.steps.every((item) => item.selected && item.selected.missingCapabilities.length === 0)).toBe(true);
    expect(new Set(plan.subscriptions.map((item) => item.productId)).size).toBe(plan.subscriptions.length);
  }
  return plans;
}

describe("cross-domain recommendation scenarios", () => {
  it("A — video uses a three-tool fallback only for the composite production step", () => {
    const roadmap = [
      step("v1", "Analyze the financial report", "Extract financial figures and define the story", ["document_parsing", "reasoning", "structured_data_output"]),
      step("v2", "Generate and edit the final video", "Create charts, Vietnamese voice-over, video, and final editing", ["image_generation", "text_to_speech", "video_generation", "video_editing"], ["image", "audio", "video"]),
    ];
    const models = [
      model("finance", "Finance Analyst", "finance", ["document_parsing", "reasoning", "structured_data_output"]),
      model("visual-video", "Visual Video Studio", "video", ["image_generation", "video_generation"], ["image", "video"], "Video Studio"),
      model("voice", "Vietnamese Voice", "audio", ["text_to_speech"], ["audio"], "Voice Studio"),
      model("editor", "Final Cut Service", "video_editing", ["video_editing"], ["video"], "Editing Studio"),
    ];
    const plans = assertCompletePlans(roadmap, models);
    expect(plans[0].steps[1].selected?.kind).toBe("combination");
    expect(plans[0].steps[1].selected?.tools).toHaveLength(3);
  });

  it("B — coding prefers one repository agent for build, auth, database, deployment, and tests", () => {
    const roadmap = [step("c1", "Build and deploy the React SaaS", "Implement the repository, authentication, database, deployment, and automated tests", ["coding", "repository_editing", "test_generation", "deployment"] )];
    const agent = model("coding-agent", "Repository Agent", "software_engineering", ["coding", "repository_editing", "test_generation", "deployment"]);
    const plans = assertCompletePlans(roadmap, [agent]);
    expect(plans[0].steps[0].selected?.kind).toBe("single");
    expect(taskCategory(roadmap[0])).toBe("software_engineering");
  });

  it("C — research prefers one cited-research product and reuses it for report writing", () => {
    const roadmap = [
      step("r1", "Research the Southeast Asian EV market", "Find current evidence and cite sources", ["web_research", "citation_support", "reasoning"]),
      step("r2", "Write the cited report", "Create a cited 20-page market report", ["web_research", "citation_support", "reasoning", "long_context", "text_generation"]),
    ];
    const research = model("research-suite", "Research Suite", "research", ["web_research", "citation_support", "reasoning", "long_context", "text_generation"], ["text"], "Research Suite");
    const plans = assertCompletePlans(roadmap, [research]);
    expect(plans[0].uniqueProductCount).toBe(1);
    expect(plans[0].steps.every((item) => item.selected?.kind === "single")).toBe(true);
  });

  it("D — legal uses one verified long-context translation tool", () => {
    const roadmap = [step("l1", "Analyze and translate the commercial contract", "Review 120 pages, identify risky clauses, and translate the summary into Vietnamese", ["document_parsing", "long_context", "reasoning", "translation"] )];
    const legal = model("legal-suite", "Legal Review Suite", "legal", ["document_parsing", "long_context", "reasoning", "translation"]);
    const plans = assertCompletePlans(roadmap, [legal]);
    expect(plans[0].steps[0].selected?.kind).toBe("single");
    expect(taskCategory(roadmap[0])).toBe("legal");
  });

  it("E — design maps each roadmap step to relevant evidence without media assumptions on UI work", () => {
    const roadmap = [
      step("d1", "Create the responsive SaaS landing page and UI system", "Design and implement responsive UI", ["ui_generation", "coding"]),
      step("d2", "Create the presentation deck", "Generate the presentation", ["presentation_generation"]),
      step("d3", "Create marketing visuals", "Generate campaign images", ["image_generation"], ["image"]),
    ];
    const models = [
      model("ui", "UI Builder", "ui_ux_design", ["ui_generation", "coding"]),
      model("slides", "Presentation Builder", "presentation", ["presentation_generation"]),
      model("images", "Image Studio", "image_generation", ["image_generation"], ["image"]),
    ];
    const plans = assertCompletePlans(roadmap, models);
    expect(plans[0].steps.map((item) => item.taskCategory)).toEqual(["ui_ux_design", "presentation", "image_generation"]);
  });

  it("F — translation uses one long-context product and does not add media tools", () => {
    const roadmap = [step("t1", "Translate technical documentation", "Translate 500 pages from English to Vietnamese with consistent terminology", ["translation", "long_context", "document_parsing", "text_generation"] )];
    const translator = model("translation-suite", "Translation Suite", "translation", ["translation", "long_context", "document_parsing", "text_generation"]);
    const plans = assertCompletePlans(roadmap, [translator]);
    expect(plans[0].steps[0].selected?.tools).toHaveLength(1);
    expect(plans[0].steps[0].requiredCapabilities).not.toContain("image_generation");
    expect(taskCategory(roadmap[0])).toBe("translation");
  });
});
