import OpenAI from "openai";
import { zodResponseFormat, zodTextFormat } from "openai/helpers/zod";
import { StrategyInputSchema, TaskAnalysisSchema, type StrategyInput, type TaskAnalysis } from "./schema";
import { ApplicationError } from "../application-errors";

const PLANNER_INSTRUCTIONS = `You are BENCHFLOW Planner AI. Convert a non-technical project brief or monthly task list into only the necessary, task-specific workflow steps.
Never name, rank, select, or recommend AI models, providers, APIs, subscriptions, or benchmark values.
BENCHFLOW is AI-centric. The roadmap must answer "How can AI substantially complete this project?", not "What conventional software would a professional normally use?"
Shape steps around AI receiving instructions and inputs, then generating, reasoning through, automating, or substantially producing the required output. Do not create roadmap steps centered on manual timeline editing, manual drawing, manual slide construction, or other conventional software operation.
If part of the requested outcome cannot reliably be completed primarily by AI, describe the output requirement honestly and recommend human review; never imply that ordinary manual software is an AI solution.
Prefer deterministic or manual processing when AI is unnecessary. Add human review where errors could matter.
For one-off work, decompose the requested deliverable from source gathering through final review. Do not repeat the brief as a generic single step.
For monthly work, preserve each user's task and scale request/output estimates using its normalized monthlyUses and quality level.
Treat every supplied input as authoritative. Reflect expectedOutputs and preferredLanguage in the step outputs, modalities, capabilities, and workload estimates; raise the privacy requirement to match informationSensitivity; preserve commercialUse requirements; and use the deadline when deciding sequencing, parallel work, and review depth. Never silently discard a supplied field.
Use only capability names from this taxonomy when populating requiredCapabilities: text_generation, reasoning, coding, repository_editing, test_generation, deployment, web_research, citation_support, long_context, document_parsing, spreadsheet_analysis, structured_data_output, translation, image_generation, image_understanding, audio_generation, speech_to_text, text_to_speech, video_generation, video_editing, presentation_generation, ui_generation, browser_automation, tool_use, agentic_execution, workflow_automation, multimodal_analysis.
Include only capabilities that are actually hard requirements for the step. Do not add image, audio, video, browser, agentic, or multimodal capabilities unless the requested output or operation requires them.
Use plain language. State assumptions and warnings. Produce realistic workload ranges without claiming certainty.`;

type PlannerEnvironment = {
  GEMINI_API_KEY?: string;
  GEMINI_PLANNER_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_PLANNER_MODEL?: string;
};
type PlannerClient = Pick<OpenAI, "chat" | "responses">;

function plannerSettings(environment: PlannerEnvironment) {
  const geminiKey = environment.GEMINI_API_KEY?.trim();
  const geminiModel = environment.GEMINI_PLANNER_MODEL?.trim();
  if (geminiKey || geminiModel) {
    return {
      provider: "Google Gemini" as const,
      apiKey: geminiKey || null,
      model: geminiModel || null,
      configured: Boolean(geminiKey && geminiModel),
    };
  }

  const openAIKey = environment.OPENAI_API_KEY?.trim();
  const openAIModel = environment.OPENAI_PLANNER_MODEL?.trim();
  return {
    provider: "OpenAI" as const,
    apiKey: openAIKey || null,
    model: openAIModel || null,
    configured: Boolean(openAIKey && openAIModel),
  };
}

export function getPlannerConfiguration(environment: PlannerEnvironment = process.env as PlannerEnvironment) {
  const { provider, model, configured } = plannerSettings(environment);
  return { provider, model, configured };
}

export async function createTaskAnalysis(input: StrategyInput, options: { environment?: PlannerEnvironment; client?: PlannerClient } = {}): Promise<TaskAnalysis> {
  const validatedInput = StrategyInputSchema.parse(input);
  const environment = options.environment ?? process.env as PlannerEnvironment;
  const configuration = plannerSettings(environment);
  if (!configuration.apiKey || !configuration.model) throw new ApplicationError("PLANNER_NOT_CONFIGURED");

  const client = options.client ?? new OpenAI(configuration.provider === "Google Gemini"
    ? { apiKey: configuration.apiKey, baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" }
    : { apiKey: configuration.apiKey });

  if (configuration.provider === "Google Gemini") {
    const completion = await client.chat.completions.parse({
      model: configuration.model,
      messages: [
        { role: "system", content: PLANNER_INSTRUCTIONS },
        { role: "user", content: JSON.stringify(validatedInput) },
      ],
      response_format: zodResponseFormat(TaskAnalysisSchema, "task_analysis"),
    });
    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) throw new ApplicationError("PLANNER_FAILED");
    return TaskAnalysisSchema.parse(parsed);
  }

  const response = await client.responses.parse({
    model: configuration.model,
    input: [
      { role: "system", content: PLANNER_INSTRUCTIONS },
      { role: "user", content: JSON.stringify(validatedInput) },
    ],
    text: { format: zodTextFormat(TaskAnalysisSchema, "task_analysis") },
  });

  if (!response.output_parsed) throw new ApplicationError("PLANNER_FAILED");
  return TaskAnalysisSchema.parse(response.output_parsed);
}
