# BENCHFLOW evidence source registry

Last verified: 2026-08-07

This document is the operational record for recommendation evidence. A source is supported only when BENCHFLOW has a source-specific parser, validation rules, immutable snapshots, attribution, and tests. A reachable web page alone is not an integration.

## Supported sources

### Artificial Analysis

- Official documentation: <https://artificialanalysis.ai/data-api/docs>
- Endpoint: `GET https://artificialanalysis.ai/api/v2/language/models/free`
- Authentication: `x-api-key` from `ARTIFICIAL_ANALYSIS_API_KEY`
- Refresh: every 12 hours
- Captured fields: source model ID, creator, release date, available evaluation indices, available token prices, speed, and any context fields returned by the account tier
- Attribution: `Artificial Analysis official API`
- Validation: non-numeric metrics are omitted; missing fields stay unavailable; HTTP and schema failures fail the run
- Current deployment caveat: no successful run can be claimed until the deployment has a valid key

### OpenRouter

- Endpoint: <https://openrouter.ai/api/v1/models>
- Authentication: public read; optional bearer key
- Refresh: every 6 hours
- Captured fields: stable route ID, display name, modalities, supported parameters, context length, and input/output route prices
- Attribution: `OpenRouter official models API`
- Price note: these are OpenRouter route prices and may differ from provider-direct prices

### MMLU-Pro

- Official repository: <https://github.com/TIGER-AI-Lab/MMLU-Pro>
- Official leaderboard dataset: <https://huggingface.co/datasets/TIGER-Lab/mmlu_pro_leaderboard_submission/resolve/main/results.csv>
- License: Apache-2.0
- Refresh: every 24 hours
- Captured fields: overall score and the published Biology, Business, Chemistry, Computer Science, Economics, Engineering, Health, History, Law, Math, Philosophy, Physics, Psychology, and Other categories
- Attribution: `TIGER-Lab MMLU-Pro official leaderboard dataset`
- Identity rule: only explicit aliases join canonical models; every other row is retained in the manual-review queue
- Data-quality handling: the official CSV currently has one short row whose final category is absent; preceding columns remain aligned and the missing trailing value is stored as unavailable

### OpenAI official documentation

- Model page: <https://developers.openai.com/api/docs/models/gpt-4o>
- Data controls: <https://developers.openai.com/api/docs/guides/your-data>
- Refresh: every 12 hours
- Captured fields: model ID, snapshots/aliases, modalities, context window, supported features, input/cached-input/output prices, default training-use statement, default abuse-log retention, and availability of approved retention controls
- Attribution: `OpenAI official model and data-control documentation`
- Validation: the adapter fails if model ID, context, required price rows, or expected data-control statements disappear
- Commercial-use status: unavailable. No commercial-use observation is created because a stable official terms feed suitable for automated verification has not been confirmed.

## Unsupported sources

| Source | Intended refresh | Exact reason |
| --- | ---: | --- |
| LiveCodeBench | 24 hours | The official repository does not publish a stable, versioned multi-model leaderboard artifact for automated ingestion. |
| SWE-bench | 24 hours | No stable official machine-readable leaderboard artifact was found in the repository; raw submissions are not treated as a canonical leaderboard. |
| Open LLM Leaderboard | 24 hours | The public presentation layer does not expose a stable result contract suitable for a fail-closed production adapter. |
| MMMU | 48 hours | A stable official multi-model leaderboard artifact with model-version identifiers has not been verified. |
| MMBench | 48 hours | A stable official multi-model leaderboard artifact with model-version identifiers has not been verified. |
| LongBench | 48 hours | The official repository provides evaluation code but no stable versioned leaderboard result artifact. |
| OpenCompass | 48 hours | A single stable public result artifact and model identity contract have not been verified for automated ingestion. |

Unsupported sources remain visible in `/admin/evidence`. They contribute no scores and never trigger a fallback to invented values.

## Identity policy

Canonical IDs use stable provider/model identifiers, for example `openai/gpt-4o`. Source aliases are explicit entries in `lib/model-data/model-registry.ts`. Matching is case-normalized exact comparison only; names are never merged by edit distance, token similarity, or an LLM.

An unmatched row receives a source-scoped ID beginning with `unmatched/`, keeps its source alias and observations, and has `manualReviewRequired=true`. It remains excluded until an administrator adds and tests an explicit alias.

## Task evidence map

The deterministic map in `lib/recommendation/config.ts` separates coding, software engineering, finance, legal, healthcare, research, long-document, multimodal, writing, reasoning, image, video, and general work. Categories with no supported evidence do not borrow an unrelated benchmark. For example, generic MMLU reasoning is not accepted as LongBench evidence for a long-document task.

## Freshness and history

- Source payloads are hashed with SHA-256.
- Snapshot metadata records the normalizer version; a parser change reprocesses an unchanged payload and preserves both derivation histories.
- Changed payloads append a raw snapshot and new timestamped observations.
- Unchanged payloads append a successful sync run referencing the prior snapshot.
- Failed runs keep the prior valid snapshot and record the error.
- Recommendation results show the oldest contributing source date, evidence links, model version, raw value, retrieval date, and confidence label.

## Adding a source

1. Add metadata and an honest support status to `lib/model-data/source-registry.ts`.
2. Implement a timeout-aware official-source adapter in `lib/model-data/adapters.ts`.
3. Add a strict normalizer in `lib/model-data/normalizers.ts`; reject malformed required fields.
4. Add exact aliases in `lib/model-data/model-registry.ts` only after verifying source IDs.
5. Add parser, malformed-response, alias, attribution, and stale/fallback tests.
6. Add the cron only after the source contract and rate limits are verified.
7. Run a deployment sync and inspect snapshots, observations, and diagnostics before changing the source to supported.
