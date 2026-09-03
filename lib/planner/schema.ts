import { z } from "zod";
import { MONTHLY_FREQUENCY_MULTIPLIERS } from "../recommendation/config";

export const UsageTypeSchema = z.enum(["one_off", "monthly"]);
export type UsageType = z.infer<typeof UsageTypeSchema>;
export const PrivacyRequirementSchema = z.enum(["standard", "business", "sensitive", "restricted"]);
export const MinimumQualitySchema = z.enum(["draft", "good", "professional", "critical"]);
export const ImportanceSchema = z.enum(["low", "medium", "high", "critical"]);

export const WorkflowStepSchema = z.object({
  id: z.string(), order: z.number().int().nonnegative(), name: z.string(), plainLanguageDescription: z.string(),
  inputDescription: z.string(), outputDescription: z.string(), dependencies: z.array(z.string()), canRunInParallel: z.boolean(),
  estimatedInputTokensLow: z.number().nonnegative(), estimatedInputTokensExpected: z.number().nonnegative(), estimatedInputTokensHigh: z.number().nonnegative(),
  estimatedOutputTokensLow: z.number().nonnegative(), estimatedOutputTokensExpected: z.number().nonnegative(), estimatedOutputTokensHigh: z.number().nonnegative(),
  estimatedRequestCount: z.number().int().nonnegative(), estimatedImageCount: z.number().int().nonnegative(),
  estimatedAudioMinutes: z.number().nonnegative(), estimatedVideoMinutes: z.number().nonnegative(),
  requiredModalities: z.array(z.enum(["text", "image", "audio", "video"])), requiredCapabilities: z.array(z.string()),
  requiresCurrentInformation: z.boolean(), privacyRequirement: PrivacyRequirementSchema, commercialUseRequired: z.boolean(),
  minimumQuality: MinimumQualitySchema, importance: ImportanceSchema, noAIEligible: z.boolean(), noAIAlternative: z.string(),
  humanReviewRecommended: z.boolean(), assumptions: z.array(z.string()),
});

export const TaskAnalysisSchema = z.object({
  title: z.string(), usageType: UsageTypeSchema, summary: z.string(), interpretedGoal: z.string(), expectedResult: z.string(),
  assumptions: z.array(z.string()), warnings: z.array(z.string()), workflowSteps: z.array(WorkflowStepSchema), estimatedTotalWorkload: z.string(),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type TaskAnalysis = z.infer<typeof TaskAnalysisSchema>;

export const PrioritySchema = z.enum(["lowest_cost", "balanced", "highest_quality", "fastest", "privacy", "existing_tools"]);
export type Priority = z.infer<typeof PrioritySchema>;
const OptionalContextSchema = z.object({
  informationSensitivity: z.string(), commercialUse: z.boolean(), providersToAvoid: z.array(z.string()),
  preferredLanguage: z.string(), expectedOutputs: z.string(),
});

export const MONTHLY_USAGE_ESTIMATES = MONTHLY_FREQUENCY_MULTIPLIERS;
export function frequencyToMonthlyUses(frequency: keyof typeof MONTHLY_USAGE_ESTIMATES) { return MONTHLY_USAGE_ESTIMATES[frequency]; }

export const MonthlyTaskSchema = z.object({
  id: z.string(), task: z.string().min(3).max(300),
  frequency: z.enum(["rarely", "occasionally", "weekly", "several_week", "daily"]),
  monthlyUses: z.number().int().positive(), quality: z.enum(["good_enough", "good", "professional", "best"]),
}).refine((task) => task.monthlyUses === frequencyToMonthlyUses(task.frequency), { path: ["monthlyUses"], message: "Monthly usage must match the selected frequency" });

export const OneOffStrategyInputSchema = z.object({
  usageType: z.literal("one_off"), projectBrief: z.string().min(20).max(5000), deadline: z.string().date(),
  budgetAmount: z.number().nonnegative().nullable(), budgetCurrency: z.enum(["USD", "AUD", "VND"]),
  priorities: z.array(PrioritySchema).min(1).max(6), existingTools: z.array(z.string()), optionalContext: OptionalContextSchema,
});

export const MonthlyStrategyInputSchema = z.object({
  usageType: z.literal("monthly"), monthlyTasks: z.array(MonthlyTaskSchema).min(1).max(20), priorities: z.array(PrioritySchema).min(1).max(6),
  budgetAmount: z.number().nonnegative().nullable().optional(), budgetCurrency: z.enum(["USD", "AUD", "VND"]).optional(),
  existingTools: z.array(z.string()).max(30), optionalContext: OptionalContextSchema,
});

export const StrategyInputSchema = z.discriminatedUnion("usageType", [OneOffStrategyInputSchema, MonthlyStrategyInputSchema]);
export type StrategyInput = z.infer<typeof StrategyInputSchema>;
export type MonthlyTask = z.infer<typeof MonthlyTaskSchema>;

const DEFAULT_PRIORITY_ORDER: Priority[] = ["balanced", "lowest_cost", "highest_quality", "fastest", "privacy", "existing_tools"];
export function validatePriorityRanking(priorities: readonly string[]): Priority[] {
  const parsed = z.array(PrioritySchema).min(1).max(6).parse(priorities);
  if (new Set(parsed).size !== parsed.length) throw new Error("Each priority can appear only once.");
  return [...parsed, ...DEFAULT_PRIORITY_ORDER.filter((priority) => !parsed.includes(priority))];
}
