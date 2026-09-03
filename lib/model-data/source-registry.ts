export const SOURCE_IDS = ["artificial_analysis", "openrouter", "mmlu_pro", "open_asr", "openai_official", "official_products"] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

export type EvidenceSourceDefinition = {
  id: string;
  name: string;
  kind: "benchmark" | "catalog" | "provider_docs";
  sourceUrl: string;
  refreshHours: number;
  attribution: string;
  license?: string;
  requiredEnvironment?: string;
  supported: boolean;
  unsupportedReason?: string;
};

export const EVIDENCE_SOURCES: readonly EvidenceSourceDefinition[] = [
  {
    id: "artificial_analysis",
    name: "Artificial Analysis",
    kind: "benchmark",
    sourceUrl: "https://artificialanalysis.ai/models",
    refreshHours: 12,
    attribution: "Artificial Analysis public benchmark datasets",
    supported: true,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    kind: "catalog",
    sourceUrl: "https://openrouter.ai/api/v1/models",
    refreshHours: 6,
    attribution: "OpenRouter official models API",
    supported: true,
  },
  {
    id: "mmlu_pro",
    name: "MMLU-Pro",
    kind: "benchmark",
    sourceUrl: "https://huggingface.co/datasets/TIGER-Lab/mmlu_pro_leaderboard_submission/resolve/main/results.csv",
    refreshHours: 48,
    attribution: "TIGER-Lab MMLU-Pro official leaderboard dataset",
    license: "Apache-2.0",
    supported: true,
  },
  {
    id: "open_asr",
    name: "Open ASR Leaderboard",
    kind: "benchmark",
    sourceUrl: "https://huggingface.co/datasets/hf-audio/open-asr-leaderboard-results/resolve/main/english_short_latest.csv",
    refreshHours: 48,
    attribution: "Hugging Face Open ASR Leaderboard official results dataset",
    supported: true,
  },
  {
    id: "openai_official",
    name: "OpenAI official documentation",
    kind: "provider_docs",
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-4o",
    refreshHours: 12,
    attribution: "OpenAI official model and data-control documentation",
    supported: true,
  },
  {
    id: "official_products",
    name: "Official AI product documentation",
    kind: "provider_docs",
    sourceUrl: "https://developers.openai.com/",
    refreshHours: 24,
    attribution: "Official product documentation and pricing pages from each AI provider",
    supported: true,
  },
  {
    id: "livecodebench",
    name: "LiveCodeBench",
    kind: "benchmark",
    sourceUrl: "https://github.com/LiveCodeBench/LiveCodeBench",
    refreshHours: 24,
    attribution: "LiveCodeBench official repository",
    supported: false,
    unsupportedReason: "The official repository does not publish a stable, versioned multi-model leaderboard artifact for automated ingestion.",
  },
  {
    id: "swe_bench",
    name: "SWE-bench",
    kind: "benchmark",
    sourceUrl: "https://github.com/SWE-bench/SWE-bench",
    refreshHours: 24,
    attribution: "SWE-bench official repository",
    supported: false,
    unsupportedReason: "No stable official machine-readable leaderboard artifact was found in the repository; raw submissions are not treated as a canonical leaderboard.",
  },
  {
    id: "open_llm_leaderboard",
    name: "Open LLM Leaderboard",
    kind: "benchmark",
    sourceUrl: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard",
    refreshHours: 24,
    attribution: "Hugging Face Open LLM Leaderboard",
    supported: false,
    unsupportedReason: "The public presentation layer does not expose a stable result contract suitable for a fail-closed production adapter.",
  },
  {
    id: "mmmu",
    name: "MMMU",
    kind: "benchmark",
    sourceUrl: "https://github.com/MMMU-Benchmark/MMMU",
    refreshHours: 48,
    attribution: "MMMU official repository",
    supported: false,
    unsupportedReason: "A stable official multi-model leaderboard artifact with model-version identifiers has not been verified.",
  },
  {
    id: "mmbench",
    name: "MMBench",
    kind: "benchmark",
    sourceUrl: "https://github.com/open-compass/MMBench",
    refreshHours: 48,
    attribution: "MMBench official repository",
    supported: false,
    unsupportedReason: "A stable official multi-model leaderboard artifact with model-version identifiers has not been verified.",
  },
  {
    id: "longbench",
    name: "LongBench",
    kind: "benchmark",
    sourceUrl: "https://github.com/THUDM/LongBench",
    refreshHours: 48,
    attribution: "LongBench official repository",
    supported: false,
    unsupportedReason: "The official repository provides evaluation code but no stable versioned leaderboard result artifact.",
  },
  {
    id: "opencompass",
    name: "OpenCompass",
    kind: "benchmark",
    sourceUrl: "https://github.com/open-compass/opencompass",
    refreshHours: 48,
    attribution: "OpenCompass official repository",
    supported: false,
    unsupportedReason: "A single stable public result artifact and model identity contract have not been verified for automated ingestion.",
  },
];

export function getSourceDefinition(source: string) {
  return EVIDENCE_SOURCES.find((item) => item.id === source);
}
