import { describe, expect, it, vi } from "vitest";
import { OnboardingSchema } from "@/lib/onboarding";
import { StrategyInputSchema, TaskAnalysisSchema, frequencyToMonthlyUses, validatePriorityRanking } from "@/lib/planner/schema";
import { budgetToUsd, usdToCurrency } from "@/lib/currency";
import { createTaskAnalysis, getPlannerConfiguration } from "@/lib/planner/openai";

const plannerInput = { usageType: "one_off" as const, projectBrief: "Create a complete market research report for a new product launch.", deadline: "2027-08-20", budgetAmount: 500, budgetCurrency: "USD" as const, priorities: ["balanced" as const], existingTools: [], optionalContext: { informationSensitivity: "standard", commercialUse: false, providersToAvoid: [], preferredLanguage: "English", expectedOutputs: "A report" } };
const plannerOutput = { title: "Market research", usageType: "one_off" as const, summary: "Research and review", interpretedGoal: "Create a market research report", expectedResult: "A reviewed report", assumptions: [], warnings: [], estimatedTotalWorkload: "Two days", workflowSteps: [{ id: "step-1", order: 0, name: "Research market", plainLanguageDescription: "Gather and synthesize relevant market information.", inputDescription: "Project brief", outputDescription: "Research notes", dependencies: [], canRunInParallel: false, estimatedInputTokensLow: 500, estimatedInputTokensExpected: 1000, estimatedInputTokensHigh: 1500, estimatedOutputTokensLow: 300, estimatedOutputTokensExpected: 600, estimatedOutputTokensHigh: 900, estimatedRequestCount: 3, estimatedImageCount: 0, estimatedAudioMinutes: 0, estimatedVideoMinutes: 0, requiredModalities: ["text" as const], requiredCapabilities: [], requiresCurrentInformation: true, privacyRequirement: "standard" as const, commercialUseRequired: false, minimumQuality: "good" as const, importance: "high" as const, noAIEligible: false, noAIAlternative: "Research manually", humanReviewRecommended: true, assumptions: [] }] };

describe("input validation", () => {
  it("uses stakeholder-specific onboarding fields", () => {
    expect(() => OnboardingSchema.parse({ accountType: "individual", industry: "Media", country: "Vietnam", preferredLanguage: "Vietnamese" })).toThrow();
    const team = OnboardingSchema.parse({ accountType: "team", profession: "Product", industry: "Technology", teamSize: "6–15", country: "Vietnam", preferredLanguage: "English" });
    expect(team.accountType === "team" && team.teamSize).toBe("6–15");
    expect(() => OnboardingSchema.parse({ accountType: "enterprise", industry: "Technology", companySize: "250–999", departments: [], country: "Vietnam", preferredLanguage: "English" })).toThrow();
  });
  it("validates a one-off brief with an exact date and custom budget", () => {
    const parsed = StrategyInputSchema.parse({ usageType: "one_off", projectBrief: "Create a complete financial report video with charts and narration.", deadline: "2027-08-20", budgetAmount: 500, budgetCurrency: "USD", priorities: ["balanced"], existingTools: [], optionalContext: { informationSensitivity: "business", commercialUse: true, providersToAvoid: [], preferredLanguage: "English", expectedOutputs: "" } });
    expect(parsed.usageType).toBe("one_off");
    expect(budgetToUsd(500, "USD")).toBe(500);
  });
  it("keeps VND conversion precise enough for a consistent remaining balance", () => {
    expect(budgetToUsd(29_999_971, "VND")).toBe(1139.998898);
    expect(usdToCurrency(0.54, "VND")).toBe(14_211);
    expect(29_999_971 - usdToCurrency(0.54, "VND")).toBe(29_985_760);
  });
  it("validates monthly tasks, budget, and currency without a project brief or deadline", () => {
    const parsed = StrategyInputSchema.parse({ usageType: "monthly", monthlyTasks: [{ id: "task-1", task: "Research competitors", frequency: "daily", monthlyUses: frequencyToMonthlyUses("daily"), quality: "professional" }], budgetAmount: 100_000, budgetCurrency: "VND", priorities: ["balanced", "lowest_cost", "highest_quality", "fastest", "privacy", "existing_tools"], existingTools: ["ChatGPT"], optionalContext: { informationSensitivity: "standard", commercialUse: true, providersToAvoid: [], preferredLanguage: "English", expectedOutputs: "" } });
    expect(parsed.usageType).toBe("monthly");
    expect(parsed.usageType === "monthly" && parsed.monthlyTasks[0].monthlyUses).toBe(22);
    expect(parsed.budgetAmount).toBe(100_000);
    expect(parsed.budgetCurrency).toBe("VND");
    expect("deadline" in parsed).toBe(false);
  });
  it("rejects duplicate priorities", () => expect(() => validatePriorityRanking(["balanced", "balanced"])).toThrow("only once"));
  it("validates a structured planner result", () => { const parsed = TaskAnalysisSchema.safeParse({ title: "Launch campaign", usageType: "one_off", summary: "A campaign", interpretedGoal: "Launch café", expectedResult: "Campaign assets", assumptions: [], warnings: [], estimatedTotalWorkload: "Two days", workflowSteps: [] }); expect(parsed.success).toBe(true); });
});

describe("Planner AI", () => {
  it("reports configured only when both exact Convex variables are present", () => {
    expect(getPlannerConfiguration({ OPENAI_API_KEY: "key", OPENAI_PLANNER_MODEL: "planner-model" })).toEqual({ provider: "OpenAI", model: "planner-model", configured: true });
    expect(getPlannerConfiguration({ OPENAI_PLANNER_MODEL: "planner-model" }).configured).toBe(false);
    expect(getPlannerConfiguration({ GEMINI_API_KEY: "key", GEMINI_PLANNER_MODEL: "gemini-3.5-flash-lite" })).toEqual({ provider: "Google Gemini", model: "gemini-3.5-flash-lite", configured: true });
    expect(getPlannerConfiguration({ GEMINI_PLANNER_MODEL: "gemini-3.5-flash-lite", OPENAI_API_KEY: "key", OPENAI_PLANNER_MODEL: "planner-model" })).toEqual({ provider: "Google Gemini", model: "gemini-3.5-flash-lite", configured: false });
  });
  it("returns PLANNER_NOT_CONFIGURED when the server key is missing", async () => {
    await expect(createTaskAnalysis(plannerInput, { environment: { OPENAI_PLANNER_MODEL: "planner-model" } })).rejects.toMatchObject({ code: "PLANNER_NOT_CONFIGURED", userMessage: "The AI workflow planner is temporarily unavailable." });
  });
  it("returns a validated workflow from a configured planner", async () => {
    const parse = vi.fn().mockResolvedValue({ output_parsed: plannerOutput });
    const analysis = await createTaskAnalysis(plannerInput, { environment: { OPENAI_API_KEY: "key", OPENAI_PLANNER_MODEL: "planner-model" }, client: { responses: { parse } } as never });
    expect(analysis.workflowSteps[0].name).toBe("Research market");
    expect(parse).toHaveBeenCalledWith(expect.objectContaining({ model: "planner-model" }));
    const request = parse.mock.calls[0][0] as { input: Array<{ role: string; content: string }> };
    expect(request.input[0].content).toContain("How can AI substantially complete this project?");
    expect(request.input[0].content).toContain("never imply that ordinary manual software is an AI solution");
    expect(request.input[0].content).toContain("Treat every supplied input as authoritative");
    expect(request.input[1].content).toContain('"expectedOutputs":"A report"');
  });
  it("returns a validated workflow from the Gemini free-tier planner", async () => {
    const parse = vi.fn().mockResolvedValue({ choices: [{ message: { parsed: plannerOutput } }] });
    const analysis = await createTaskAnalysis(plannerInput, { environment: { GEMINI_API_KEY: "key", GEMINI_PLANNER_MODEL: "gemini-3.5-flash-lite" }, client: { chat: { completions: { parse } } } as never });
    expect(analysis.workflowSteps[0].name).toBe("Research market");
    expect(parse).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-3.5-flash-lite" }));
  });
});
