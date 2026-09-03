# BENCHFLOW evidence audit

Audit date: 2026-08-07

The original repository had partial Artificial Analysis and OpenRouter adapters. Artificial Analysis used the wrong endpoint for the documented free tier, OpenRouter unnecessarily required a key, model names were heuristically converted into IDs, observations duplicated on every refresh, and recommendations required an Artificial Analysis snapshot even when other valid evidence existed.

The current implementation uses source-specific contracts, snapshot hashes, append-only changed observations, explicit aliases, a manual identity-review queue, source diagnostics, and task-specific evidence selection. Supported and unsupported sources are documented in [BENCHMARK_SOURCES.md](./BENCHMARK_SOURCES.md).

The system must not be described as fully live until deployment diagnostics show successful runs for Artificial Analysis, OpenRouter, MMLU-Pro, and official provider pricing. Artificial Analysis still requires a deployment API key. Commercial-use proof remains unavailable and commercially constrained tasks fail closed.
