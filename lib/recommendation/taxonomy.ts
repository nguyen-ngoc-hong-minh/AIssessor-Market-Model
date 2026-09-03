import type { WorkflowStep } from "@/lib/planner/schema";

export const TASK_CATEGORIES = [
  "general_writing",
  "business_writing",
  "research",
  "long_document_analysis",
  "coding",
  "software_engineering",
  "translation",
  "data_analysis",
  "finance",
  "legal",
  "healthcare",
  "customer_support",
  "presentation",
  "ui_ux_design",
  "image_generation",
  "image_understanding",
  "audio_generation",
  "speech_transcription",
  "video_generation",
  "video_editing",
  "multimodal_analysis",
  "automation",
  "agentic_workflow",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const CAPABILITIES = [
  "text_generation",
  "reasoning",
  "coding",
  "repository_editing",
  "test_generation",
  "deployment",
  "web_research",
  "citation_support",
  "long_context",
  "document_parsing",
  "spreadsheet_analysis",
  "structured_data_output",
  "translation",
  "image_generation",
  "image_understanding",
  "audio_generation",
  "speech_to_text",
  "text_to_speech",
  "video_generation",
  "video_editing",
  "presentation_generation",
  "ui_generation",
  "browser_automation",
  "tool_use",
  "agentic_execution",
  "workflow_automation",
  "multimodal_analysis",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const CAPABILITY_SET = new Set<string>(CAPABILITIES);
const CAPABILITY_ALIASES: Record<string, Capability> = {
  structured_output: "structured_data_output",
  structured_outputs: "structured_data_output",
  json_output: "structured_data_output",
  web_search: "web_research",
  web_search_options: "web_research",
  retrieval: "web_research",
  source_citations: "citation_support",
  citations: "citation_support",
  code_generation: "coding",
  code_execution: "coding",
  software_development: "coding",
  repo_editing: "repository_editing",
  repository_level_editing: "repository_editing",
  automated_tests: "test_generation",
  visual_design: "ui_generation",
  storyboarding: "image_generation",
  image_analysis: "image_understanding",
  vision: "image_understanding",
  audio_transcription: "speech_to_text",
  transcription: "speech_to_text",
  speech_generation: "text_to_speech",
  voice_generation: "text_to_speech",
  tool_calling: "tool_use",
  function_calling: "tool_use",
  tools: "tool_use",
  tool_choice: "tool_use",
  parallel_tool_calls: "tool_use",
  file_search: "document_parsing",
  file_uploads: "document_parsing",
  image_input: "image_understanding",
  include_reasoning: "reasoning",
  reasoning_effort: "reasoning",
  agents: "agentic_execution",
  automation: "workflow_automation",
};

export const TASK_EVIDENCE_MAP: Record<TaskCategory, readonly string[]> = {
  general_writing: ["writing", "preference", "general", "reasoning"],
  business_writing: ["business", "writing", "preference", "reasoning"],
  research: ["research", "reasoning", "general"],
  long_document_analysis: ["long_document"],
  coding: ["coding", "coding_knowledge"],
  software_engineering: ["software_engineering", "coding"],
  translation: ["translation", "multilingual", "writing"],
  data_analysis: ["data_analysis", "math", "reasoning"],
  finance: ["finance", "business", "economics", "math", "reasoning"],
  legal: ["legal", "law", "long_document"],
  healthcare: ["healthcare", "biology", "reasoning"],
  customer_support: ["customer_support", "writing", "general"],
  presentation: ["presentation", "multimodal", "writing"],
  ui_ux_design: ["ui_ux_design", "design", "coding", "multimodal"],
  image_generation: ["image", "image_generation", "multimodal"],
  image_understanding: ["image_understanding", "multimodal"],
  audio_generation: ["audio", "speech", "multimodal"],
  speech_transcription: ["transcription", "speech", "multimodal"],
  video_generation: ["video", "video_generation", "multimodal"],
  video_editing: ["video_editing", "video", "multimodal"],
  multimodal_analysis: ["multimodal"],
  automation: ["automation", "coding", "reasoning"],
  agentic_workflow: ["agentic", "automation", "coding", "reasoning"],
};

export const CAPABILITY_EVIDENCE_MAP: Record<Capability, readonly string[]> = {
  text_generation: ["writing", "preference", "general", "reasoning"],
  reasoning: ["reasoning", "general", "research", "finance", "legal", "healthcare", "math", "business"],
  coding: ["coding", "coding_knowledge", "software_engineering"],
  repository_editing: ["software_engineering", "coding"],
  test_generation: ["software_engineering", "coding"],
  deployment: ["software_engineering", "coding", "agentic"],
  web_research: ["research", "reasoning", "general"],
  citation_support: ["research", "reasoning"],
  long_context: ["long_document"],
  document_parsing: ["long_document", "legal", "finance", "research"],
  spreadsheet_analysis: ["data_analysis", "math", "finance", "reasoning"],
  structured_data_output: ["data_analysis", "finance", "reasoning", "general"],
  translation: ["translation", "multilingual", "writing"],
  image_generation: ["image", "image_generation", "multimodal"],
  image_understanding: ["image_understanding", "multimodal"],
  audio_generation: ["audio", "speech", "multimodal"],
  speech_to_text: ["transcription", "speech", "multimodal"],
  text_to_speech: ["audio", "speech", "multimodal"],
  video_generation: ["video", "video_generation", "multimodal"],
  video_editing: ["video_editing", "video", "multimodal"],
  presentation_generation: ["presentation", "multimodal", "writing"],
  ui_generation: ["ui_ux_design", "design", "coding", "multimodal"],
  browser_automation: ["automation", "agentic", "coding"],
  tool_use: ["agentic", "automation", "reasoning"],
  agentic_execution: ["agentic", "automation", "coding", "reasoning"],
  workflow_automation: ["automation", "agentic", "coding", "reasoning"],
  multimodal_analysis: ["multimodal"],
};

export function evidenceCategoriesForCapabilities(capabilities: readonly Capability[]) {
  return [...new Set(capabilities.flatMap((capability) => CAPABILITY_EVIDENCE_MAP[capability]))];
}

const CATEGORY_CAPABILITIES: Record<TaskCategory, readonly Capability[]> = {
  general_writing: ["text_generation"],
  business_writing: ["text_generation", "reasoning"],
  research: ["web_research", "citation_support", "reasoning"],
  long_document_analysis: ["long_context", "document_parsing", "reasoning"],
  coding: ["coding"],
  software_engineering: ["coding", "repository_editing", "test_generation"],
  translation: ["translation", "text_generation"],
  data_analysis: ["spreadsheet_analysis", "reasoning", "structured_data_output"],
  finance: ["reasoning", "document_parsing", "structured_data_output"],
  legal: ["reasoning", "document_parsing"],
  healthcare: ["reasoning", "document_parsing"],
  customer_support: ["text_generation"],
  presentation: ["presentation_generation"],
  ui_ux_design: ["ui_generation"],
  image_generation: ["image_generation"],
  image_understanding: ["image_understanding"],
  audio_generation: ["audio_generation"],
  speech_transcription: ["speech_to_text"],
  video_generation: ["video_generation"],
  video_editing: ["video_editing"],
  multimodal_analysis: ["multimodal_analysis", "image_understanding"],
  automation: ["workflow_automation", "tool_use"],
  agentic_workflow: ["agentic_execution", "tool_use"],
};

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function normalizeCapability(value: string): Capability | null {
  const normalized = slug(value);
  if (CAPABILITY_SET.has(normalized)) return normalized as Capability;
  return CAPABILITY_ALIASES[normalized] ?? null;
}

export function normalizedCapabilities(values: readonly string[]) {
  return [...new Set(values.map(normalizeCapability).filter((value): value is Capability => value !== null))];
}

function stepText(step: Pick<WorkflowStep, "name" | "plainLanguageDescription" | "inputDescription" | "outputDescription" | "requiredCapabilities">) {
  return `${step.name} ${step.plainLanguageDescription} ${step.inputDescription} ${step.outputDescription} ${step.requiredCapabilities.join(" ")}`.toLowerCase();
}

export function taskCategory(step: WorkflowStep): TaskCategory {
  const text = stepText(step);
  const capabilities = normalizedCapabilities(step.requiredCapabilities);
  const has = (capability: Capability) => capabilities.includes(capability);
  if (has("video_editing") || /video edit|final edit|post.production/.test(text)) return "video_editing";
  if (has("video_generation")) return "video_generation";
  if (has("speech_to_text")) return "speech_transcription";
  if (has("text_to_speech") || has("audio_generation")) return "audio_generation";
  if (has("image_generation")) return "image_generation";
  if (has("multimodal_analysis")) return "multimodal_analysis";
  if (has("image_understanding")) return "image_understanding";
  if (has("agentic_execution")) return "agentic_workflow";
  if (has("workflow_automation") || has("browser_automation")) return "automation";
  if (has("presentation_generation")) return "presentation";
  if (has("ui_generation")) return "ui_ux_design";
  if (/repository|software engineer|debug|bug fix|pull request|codebase|automated test/.test(text)) return "software_engineering";
  if (has("coding") || /\b(code|coding|programming|software development|application development|web development)\b/.test(text)) return "coding";
  if (/contract|legal|law|compliance|case brief|clause/.test(text)) return "legal";
  if (/health|medical|clinical|patient|biology/.test(text)) return "healthcare";
  if (/finance|financial|accounting|investment|economics|forecast/.test(text)) return "finance";
  if (has("translation") || /\btranslate|translation|multilingual\b/.test(text)) return "translation";
  if (has("spreadsheet_analysis") || /spreadsheet|dataset|data analys|visuali[sz]e data|chart/.test(text)) return "data_analysis";
  if (/long document|large document|\d+ pages|book|many pages|technical documentation/.test(text)) return "long_document_analysis";
  if (has("web_research") || /research|literature review|fact check|evidence synthesis|cite sources/.test(text)) return "research";
  if (/customer support|support ticket|help desk|customer response/.test(text)) return "customer_support";
  if (/presentation|slide deck|slides|pitch deck/.test(text)) return "presentation";
  if (/ui\/ux|user interface|design system|landing page|wireframe|prototype/.test(text)) return "ui_ux_design";
  if (step.requiredModalities.includes("video")) return /edit|assemble|post.production/.test(text) ? "video_editing" : "video_generation";
  if (step.requiredModalities.includes("audio")) return /transcri|speech.to.text/.test(text) ? "speech_transcription" : "audio_generation";
  if (step.requiredModalities.includes("image")) return /analy|classif|extract|read|inspect|understand/.test(text) ? "image_understanding" : "image_generation";
  if (/proposal|memo|business plan|executive summary|report|marketing copy/.test(text)) return "business_writing";
  return "general_writing";
}

export function requiredCapabilitiesForStep(step: WorkflowStep): Capability[] {
  const category = taskCategory(step);
  const required = new Set<Capability>(normalizedCapabilities(step.requiredCapabilities));
  for (const capability of CATEGORY_CAPABILITIES[category]) required.add(capability);
  if (step.requiresCurrentInformation) required.add("web_research");
  if (step.estimatedInputTokensHigh >= 32_000) required.add("long_context");
  if (step.requiredModalities.includes("text") && !["image_generation", "audio_generation", "video_generation", "video_editing"].includes(category)) required.add("text_generation");
  if (step.requiredModalities.includes("image") && !["image_generation", "image_understanding"].some((capability) => required.has(capability as Capability))) required.add(category === "image_generation" ? "image_generation" : "image_understanding");
  if (step.requiredModalities.includes("video") && !["video_generation", "video_editing"].some((capability) => required.has(capability as Capability))) required.add(category === "video_editing" ? "video_editing" : "video_generation");
  if (step.requiredModalities.includes("audio") && !["audio_generation", "speech_to_text", "text_to_speech"].some((capability) => required.has(capability as Capability))) required.add(category === "speech_transcription" ? "speech_to_text" : "audio_generation");
  return [...required];
}

export function effectiveModelCapabilities(model: { capabilities: string[]; modalities: string[]; contextWindow: number | null; evidence?: Array<{ kind: string; category: string; metricName?: string }> }) {
  const result = new Set<Capability>(normalizedCapabilities(model.capabilities));
  if (model.modalities.includes("text")) result.add("text_generation");
  if (model.modalities.includes("image")) result.add("image_understanding");
  if (model.contextWindow !== null && model.contextWindow >= 32_000) result.add("long_context");
  for (const item of model.evidence ?? []) {
    if (item.kind !== "benchmark") continue;
    if (["reasoning", "general", "finance", "legal", "healthcare", "math", "business"].includes(item.category)) result.add("reasoning");
    if (["coding", "coding_knowledge", "software_engineering"].includes(item.category)) result.add("coding");
    if (item.category === "software_engineering") result.add("repository_editing");
    if (["translation", "multilingual"].includes(item.category)) result.add("translation");
    if (item.category === "long_document") { result.add("long_context"); result.add("document_parsing"); }
    if (item.category === "multimodal") result.add("multimodal_analysis");
    if (item.category === "agentic") { result.add("agentic_execution"); result.add("tool_use"); }
    if (item.category === "ui_ux_design" || /design_arena/i.test(item.metricName ?? "")) result.add("ui_generation");
  }
  return [...result];
}

export function affectedTaskCategories(capabilities: readonly string[], evidenceCategories: readonly string[]) {
  const changedCapabilities = new Set(normalizedCapabilities(capabilities));
  const changedEvidence = new Set(evidenceCategories);
  return TASK_CATEGORIES.filter((category) =>
    CATEGORY_CAPABILITIES[category].some((capability) => changedCapabilities.has(capability))
    || TASK_EVIDENCE_MAP[category].some((evidence) => changedEvidence.has(evidence)),
  );
}
