import { createHash } from "node:crypto";
import type { SourceId } from "./source-registry";
import { OFFICIAL_AI_PRODUCTS } from "./product-catalog";

export type SourceSnapshot = {
  source: SourceId;
  sourceUrl: string;
  attribution: string;
  payload: unknown;
  payloadHash: string;
  fetchedAt: number;
  sourceVersion?: string;
  metadata?: Record<string, unknown>;
};

export interface ModelSourceAdapter {
  readonly source: SourceId;
  fetchSnapshot(): Promise<SourceSnapshot>;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

function snapshot(source: SourceId, sourceUrl: string, attribution: string, payload: unknown, response?: Response): SourceSnapshot {
  const serialised = typeof payload === "string" ? payload : stableJson(payload);
  const sourceVersion = response?.headers.get("x-repo-commit") ?? response?.headers.get("etag") ?? response?.headers.get("last-modified") ?? undefined;
  return {
    source,
    sourceUrl,
    attribution,
    payload,
    payloadHash: createHash("sha256").update(serialised).digest("hex"),
    fetchedAt: Date.now(),
    sourceVersion,
    metadata: response ? { contentType: response.headers.get("content-type"), sourceVersion } : undefined,
  };
}

async function checkedFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "User-Agent": "BENCHFLOW/1.0 evidence-sync", ...init?.headers }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response;
}

type PublicDataset = { name?: string; description?: string; data?: Array<Record<string, unknown>> };

function publicDatasets(html: string): PublicDataset[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((match) => {
    try {
      const parsed = JSON.parse(match[1]) as PublicDataset;
      return Array.isArray(parsed.data) ? [parsed] : [];
    } catch {
      return [];
    }
  });
}

function propertyValue(value: unknown, name: string) {
  if (!Array.isArray(value)) return undefined;
  const item = value.find((entry) => entry && typeof entry === "object" && (entry as Record<string, unknown>).name === name) as Record<string, unknown> | undefined;
  return typeof item?.value === "number" ? item.value : undefined;
}

function rankPercentiles(rows: Array<Record<string, unknown>>, scoreKey: string) {
  const ranked = rows.filter((row) => typeof row[scoreKey] === "number").sort((a, b) => Number(b[scoreKey]) - Number(a[scoreKey]));
  return new Map(ranked.map((row, index) => [String(row.detailsUrl ?? row.label), ranked.length === 1 ? 100 : 40 + ((ranked.length - 1 - index) / (ranked.length - 1)) * 60]));
}

function mergeLanguageDatasets(datasets: PublicDataset[]) {
  const quality = datasets.find((item) => item.name === "Artificial Analysis Intelligence Index")?.data ?? [];
  const pricing = datasets.find((item) => item.name === "Pricing: Cache Hit, Input, and Output")?.data ?? [];
  const context = datasets.find((item) => item.name === "Context Window")?.data ?? [];
  const speed = datasets.find((item) => item.name === "Output Speed")?.data ?? [];
  const qualityPercentiles = rankPercentiles(quality, "intelligenceIndex");
  const rows = new Map<string, Record<string, unknown>>();
  const row = (item: Record<string, unknown>) => {
    const key = String(item.detailsUrl ?? item.label ?? "");
    const current = rows.get(key) ?? { name: item.label, slug: key.split("/").filter(Boolean).at(-1), model_creator: {} };
    rows.set(key, current);
    return current;
  };
  for (const item of quality) row(item).evaluations = { artificial_analysis_intelligence_index: { score: item.intelligenceIndex, normalizedValue: qualityPercentiles.get(String(item.detailsUrl ?? item.label)) } };
  for (const item of pricing) {
    const current = row(item);
    current.pricing = {
      price_1m_input_tokens: propertyValue(item.pricing, "inputPrice"),
      price_1m_output_tokens: propertyValue(item.pricing, "outputPrice"),
    };
  }
  for (const item of context) row(item).context_window_tokens = item.contextWindowTokens;
  for (const item of speed) row(item).performance = { median_output_tokens_per_second: item.outputSpeed };
  return [...rows.values()];
}

function mergeMediaDatasets(datasets: PublicDataset[], kind: "image" | "video") {
  const qualityName = kind === "image" ? "Image Arena Quality Elo" : "Video Arena Quality Elo";
  const priceName = kind === "image" ? "Price ($/1k images)" : "Price ($/min)";
  const quality = datasets.find((item) => item.name === qualityName)?.data ?? [];
  const prices = datasets.find((item) => item.name === priceName)?.data ?? [];
  const percentiles = rankPercentiles(quality.map((item) => ({ ...item, score: propertyValue(item.elo, "mid") })), "score");
  const priceByName = new Map(prices.map((item) => [String(item.label), item.price]));
  return quality.flatMap((item) => {
    const name = typeof item.label === "string" ? item.label : undefined;
    const sourcePath = typeof item.detailsUrl === "string" ? item.detailsUrl : undefined;
    const qualityElo = propertyValue(item.elo, "mid");
    const price = name ? priceByName.get(name) : undefined;
    if (!name || !sourcePath || qualityElo === undefined || typeof price !== "number") return [];
    return [{ name, sourcePath, qualityElo, normalizedQuality: percentiles.get(sourcePath), price }];
  });
}

function mergeTextToSpeechDatasets(datasets: PublicDataset[]) {
  const quality = datasets.find((item) => item.name === "Provider Voice Arena Quality Elo")?.data ?? [];
  const pricing = datasets.find((item) => item.name === "Price")?.data ?? [];
  const speed = datasets.find((item) => item.name === "Characters Per Second")?.data ?? [];
  const rows = new Map<string, Record<string, unknown>>();
  const row = (item: Record<string, unknown>) => {
    const path = String(item.detailsUrl ?? "");
    const key = path.split("/").filter(Boolean).at(-1) ?? String(item.label ?? "").toLowerCase();
    const rawLabel = String(item.label ?? "");
    const labelParts = rawLabel.split(",").map((part) => part.trim());
    const current = rows.get(key) ?? { name: labelParts[0], sourcePath: path };
    if (labelParts[1]) current.provider = labelParts[1];
    rows.set(key, current);
    return current;
  };
  const qualityPercentiles = rankPercentiles(quality, "qualityElo");
  for (const item of quality) {
    const current = row(item);
    current.qualityElo = item.qualityElo;
    current.normalizedQuality = qualityPercentiles.get(String(item.detailsUrl ?? item.label));
  }
  for (const item of pricing) row(item).pricePer1mCharacters = item.pricePer1mCharacters;
  for (const item of speed) row(item).charactersPerSecond = item.charactersPerSecond;
  return [...rows.values()];
}

export function parseArtificialAnalysisPublicPages(languageHtml: string, imageHtml: string, videoHtml: string, textToSpeechHtml = "") {
  return {
    data: mergeLanguageDatasets(publicDatasets(languageHtml)),
    imageModels: mergeMediaDatasets(publicDatasets(imageHtml), "image"),
    videoModels: mergeMediaDatasets(publicDatasets(videoHtml), "video"),
    textToSpeechModels: mergeTextToSpeechDatasets(publicDatasets(textToSpeechHtml)),
  };
}

export class ArtificialAnalysisAdapter implements ModelSourceAdapter {
  readonly source = "artificial_analysis" as const;
  constructor(private readonly apiKey: string, private readonly baseUrl = "https://artificialanalysis.ai/api/v2", private readonly geminiApiKey = "") {}
  async fetchSnapshot(): Promise<SourceSnapshot> {
    const sourceUrl = "https://artificialanalysis.ai/models";
    const [languageResponse, imageResponse, videoResponse, textToSpeechResponse] = await Promise.all([
      checkedFetch(sourceUrl),
      checkedFetch("https://artificialanalysis.ai/image/models"),
      checkedFetch("https://artificialanalysis.ai/video/models"),
      checkedFetch("https://artificialanalysis.ai/text-to-speech/models"),
    ]);
    const publicPayload = parseArtificialAnalysisPublicPages(await languageResponse.text(), await imageResponse.text(), await videoResponse.text(), await textToSpeechResponse.text());
    const googleModels = this.geminiApiKey ? await checkedFetch("https://generativelanguage.googleapis.com/v1beta/models", { headers: { "x-goog-api-key": this.geminiApiKey } }).then((response) => response.json()).then((payload) => (payload as { models?: unknown[] }).models ?? []) : [];
    const publicPayloadWithAccess = { ...publicPayload, googleModels };
    if (!this.apiKey) return snapshot(this.source, sourceUrl, "Artificial Analysis public benchmark datasets and Google Gemini model catalog", publicPayloadWithAccess, languageResponse);

    const apiUrl = `${this.baseUrl}/language/models/free`;
    const pages: unknown[] = [];
    let page = 1;
    let apiResponse: Response | undefined;
    while (page <= 100) {
      apiResponse = await checkedFetch(page === 1 ? apiUrl : `${apiUrl}?page=${page}`, { headers: { "x-api-key": this.apiKey } });
      const payload = await apiResponse.json() as Record<string, unknown>;
      pages.push(...(Array.isArray(payload.data) ? payload.data : []));
      const pagination = (payload.pagination && typeof payload.pagination === "object" ? payload.pagination : {}) as Record<string, unknown>;
      const current = Number(pagination.current_page ?? pagination.page ?? page);
      const total = Number(pagination.total_pages ?? current);
      if (!Number.isFinite(total) || current >= total) break;
      page = current + 1;
    }
    return snapshot(this.source, apiUrl, "Artificial Analysis official API, public benchmark datasets, and Google Gemini model catalog", { ...publicPayloadWithAccess, data: pages }, apiResponse ?? languageResponse);
  }
}

export class OpenRouterAdapter implements ModelSourceAdapter {
  readonly source = "openrouter" as const;
  constructor(private readonly apiKey = "", private readonly baseUrl = "https://openrouter.ai/api/v1") {}
  async fetchSnapshot(): Promise<SourceSnapshot> {
    const sourceUrl = `${this.baseUrl}/models?output_modalities=all`;
    const headers = this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined;
    const [response, imageResponse, videoResponse] = await Promise.all([
      checkedFetch(sourceUrl, { headers }),
      checkedFetch(`${this.baseUrl}/images/models`, { headers }),
      checkedFetch(`${this.baseUrl}/videos/models`, { headers }),
    ]);
    const [modelsPayload, imagePayload, videoPayload] = await Promise.all([
      response.json() as Promise<Record<string, unknown>>,
      imageResponse.json() as Promise<Record<string, unknown>>,
      videoResponse.json() as Promise<Record<string, unknown>>,
    ]);
    const imageModels = await Promise.all((Array.isArray(imagePayload.data) ? imagePayload.data : []).map(async (raw) => {
      const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      if (typeof item.endpoints !== "string" || !item.endpoints.startsWith("/")) return item;
      const endpointUrl = `${new URL(this.baseUrl).origin}${item.endpoints}`;
      try { return { ...item, endpointDetails: await (await checkedFetch(endpointUrl, { headers })).json() }; }
      catch { return item; }
    }));
    return snapshot(this.source, sourceUrl, "OpenRouter complete text, image, audio, embedding, reranking, transcription, speech, and video model catalogs with published benchmark metadata", { ...modelsPayload, imageModels, videoModels: Array.isArray(videoPayload.data) ? videoPayload.data : [] }, response);
  }
}

export class MmluProAdapter implements ModelSourceAdapter {
  readonly source = "mmlu_pro" as const;
  constructor(private readonly sourceUrl = "https://huggingface.co/datasets/TIGER-Lab/mmlu_pro_leaderboard_submission/resolve/main/results.csv") {}
  async fetchSnapshot(): Promise<SourceSnapshot> {
    const response = await checkedFetch(this.sourceUrl);
    return snapshot(this.source, this.sourceUrl, "TIGER-Lab MMLU-Pro official leaderboard dataset", await response.text(), response);
  }
}

export class OpenAsrAdapter implements ModelSourceAdapter {
  readonly source = "open_asr" as const;
  constructor(private readonly sourceUrl = "https://huggingface.co/datasets/hf-audio/open-asr-leaderboard-results/resolve/main/english_short_latest.csv") {}
  async fetchSnapshot(): Promise<SourceSnapshot> {
    const response = await checkedFetch(this.sourceUrl);
    return snapshot(this.source, this.sourceUrl, "Hugging Face Open ASR Leaderboard official results dataset", await response.text(), response);
  }
}

export class OpenAiOfficialAdapter implements ModelSourceAdapter {
  readonly source = "openai_official" as const;
  constructor(
    private readonly modelUrls = ["https://developers.openai.com/api/docs/models/gpt-4o.md"],
    private readonly privacyUrl = "https://developers.openai.com/api/docs/guides/your-data.md",
  ) {}
  async fetchSnapshot(): Promise<SourceSnapshot> {
    const [models, privacyResponse] = await Promise.all([
      Promise.all(this.modelUrls.map(async (url) => ({ url, markdown: await (await checkedFetch(url)).text() }))),
      checkedFetch(this.privacyUrl),
    ]);
    const payload = { models, privacy: { url: this.privacyUrl, markdown: await privacyResponse.text() } };
    return snapshot(this.source, this.modelUrls[0], "OpenAI official model and data-control documentation", payload, privacyResponse);
  }
}

export class OfficialProductsAdapter implements ModelSourceAdapter {
  readonly source = "official_products" as const;
  async fetchSnapshot(): Promise<SourceSnapshot> {
    const products = await Promise.all(OFFICIAL_AI_PRODUCTS.map(async (product) => {
      try {
        const response = await checkedFetch(product.verificationUrl ?? product.sourceUrl);
        const content = (await response.text()).toLowerCase().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
        const matchedTerms = product.verificationTerms.filter((term) => content.includes(term.toLowerCase()));
        return { id: product.id, sourceUrl: product.sourceUrl, ok: true, matchedTerms, status: response.status };
      } catch (error) {
        return { id: product.id, sourceUrl: product.sourceUrl, ok: false, error: error instanceof Error ? error.message : "Official page unavailable" };
      }
    }));
    if (!products.some((product) => product.ok)) throw new Error("No official AI product documentation could be verified");
    return snapshot(this.source, "https://developers.openai.com/", "Official AI product documentation and pricing pages", { products });
  }
}
