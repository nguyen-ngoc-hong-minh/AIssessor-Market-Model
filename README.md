# AIssessor

AIssessor turns a project brief or recurring workload into an editable AI workflow, then applies hard eligibility filters, task-specific evidence selection, workload cost calculation, and deterministic scoring. An LLM decomposes the workflow; it does not choose models or manufacture evidence.

The public homepage includes an anonymous trial. Visitors can describe a project, review and edit the generated workflow, and receive the real evidence-backed recommendation without creating an account. Authentication is requested only when the visitor chooses **Save My Recommendation**; the anonymous trial is then claimed into their strategy history.

## Architecture

- Next.js App Router, React, TypeScript, Tailwind CSS, Lucide, React Hook Form, Zod, and React Flow
- Clerk authentication with an official Clerk/Convex JWT integration
- Convex for profiles, strategies, subscriptions, immutable source snapshots, timestamped observations, sync history, and cron jobs
- Google Gemini or OpenAI Structured Outputs for workflow decomposition only
- Deterministic recommendation scoring configured in `lib/recommendation/config.ts`
- Capability-first recommendations across writing, research, coding, analysis, regulated work, design, media, automation, and agentic workflows
- AI-first procurement: only verified AI-native or AI-centric products can enter the primary recommendation stack
- Anonymous trial records stored as expiring, hashed-token Convex documents and claimed by a Clerk user only on Save
- Stripe Checkout, Customer Portal, and webhook-synchronized entitlements

## Local setup

1. Use Node.js 22.13 or newer and run `npm install`.
2. Create `.env.local` from `.env.example` and add development credentials.
3. Configure Clerk email/password and desired OAuth providers. Create a Clerk JWT template named `convex` with `aud: "convex"`, then set that same Clerk instance's issuer as `CLERK_JWT_ISSUER_DOMAIN` in Convex.
4. Set `EVIDENCE_ADMIN_EMAILS` in Convex to a comma-separated list of administrators.
5. Configure the Planner AI variables in the Convex development deployment. They are read by Convex Actions and must not use a `NEXT_PUBLIC_` prefix:

   ```bash
   npx convex env set GEMINI_API_KEY <server-api-key>
   npx convex env set GEMINI_PLANNER_MODEL gemini-3.5-flash-lite
   ```

   Adding these only to `.env.local` does not configure the remote Convex Action runtime. `.env.local` is for the local Next.js host and public Convex/Clerk connection values.
6. `ARTIFICIAL_ANALYSIS_API_KEY` and `OPENROUTER_API_KEY` are optional. Without keys, BENCHFLOW reads the public machine-readable benchmark datasets and the public OpenRouter catalog.
7. Run `npm run convex:dev`, then `npm run dev`.
8. Open `/admin/evidence` as a configured administrator and confirm Planner AI shows `Configured: Yes` before creating a strategy.

## Clerk and Convex authentication

The browser and Next.js server use `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. Convex independently verifies Clerk session tokens using `CLERK_JWT_ISSUER_DOMAIN` and the `convex` audience configured in `convex/auth.config.ts`. The publishable key, secret key, JWT template, and issuer must all belong to the same Clerk instance.

Clerk user synchronization is delivered directly to the existing Convex HTTP Action:

```text
https://perceptive-snake-642.convex.site/clerk-webhook
```

Subscribe that endpoint to `user.created`, `user.updated`, and `user.deleted`. Store its signing secret as `CLERK_WEBHOOK_SIGNING_SECRET` in the Convex deployment, and store a private relay value as `CLERK_WEBHOOK_SYNC_KEY` in the same deployment. Neither value belongs in browser code or a `NEXT_PUBLIC_*` variable.

## Planner AI configuration

The planner prefers Gemini when either Gemini variable is present:

- `GEMINI_API_KEY`: Google AI Studio API key used by the Convex Action
- `GEMINI_PLANNER_MODEL`: Gemini model ID; `gemini-3.5-flash-lite` supports the limited free tier

OpenAI remains available as an optional paid fallback:

- `OPENAI_API_KEY`: OpenAI server API key used by the Convex Action
- `OPENAI_PLANNER_MODEL`: OpenAI Responses API model ID used for structured workflow generation

For local development against the Convex development deployment, set one complete provider pair with `npx convex env set` as shown above or in the Convex development deployment dashboard. For a preview/staging Convex deployment, select that deployment and set both variables in its environment. For production with Gemini, set:

```bash
npx convex env set --prod GEMINI_API_KEY <server-api-key>
npx convex env set --prod GEMINI_PLANNER_MODEL gemini-3.5-flash-lite
```

The frontend hosting environment does not need planner credentials; planner calls execute in Convex. Never add an API key to browser code or a `NEXT_PUBLIC_*` variable. `/admin/evidence` reports configuration status, provider, model, last successful analysis, and the latest safe error without returning the key.

## Evidence system

Supported adapters:

| Source | Evidence | Schedule | Credential |
| --- | --- | ---: | --- |
| Artificial Analysis public datasets / free API | Language, image, and video quality benchmarks, speed, context, and representative API pricing | 12 hours | Optional |
| OpenRouter models API | Canonical route IDs, modalities, capabilities, context, and route pricing | 6 hours | Optional |
| MMLU-Pro official leaderboard CSV | Overall and subject-category benchmark results | 48 hours | None |
| Hugging Face Open ASR Leaderboard | Speech-to-text WER and real-time throughput | 48 hours | None |
| OpenAI official model/data-control docs | Provider pricing, context, modalities, capabilities, and default API privacy controls | 12 hours | None |
| Official AI product documentation | Product capabilities and verified access for Codex, Cursor, Claude Code, GitHub Copilot, Replit Agent, Lovable, v0, Midjourney, Runway, Gamma, ElevenLabs, and other curated AI-first products | 24 hours | None |

Each changed response creates a raw snapshot with a SHA-256 hash, retrieval time, source URL, attribution, and source revision where exposed. Observations are append-only. An unchanged response records a successful audit run without duplicating the snapshot or observations. A failed refresh preserves the last valid snapshot.

Cross-source model joins require exact source IDs or aliases declared in `lib/model-data/model-registry.ts`. Unknown benchmark names are retained as manual-review identities and cannot enter recommendations.

The engine excludes candidates missing required task evidence, prices, context, modalities, capabilities, privacy controls, commercial-use proof, or region availability. A verified subscription product may use official capability evidence instead of API token pricing or a model context window; that evidence never becomes a fabricated comparative benchmark score. Missing values remain unavailable. Commercial-use proof is currently unavailable for the integrated OpenAI model because a stable machine-readable official terms source has not been verified; commercially constrained tasks therefore fail closed.

Recommendations search for one eligible tool first. Only when no single tool meets every hard requirement does the engine search two-tool and then three-tool combinations. If no complete option fits the entered budget, BENCHFLOW keeps the closest complete option and reports the known overrun instead of returning an empty result. The global optimizer accounts for budget, existing subscriptions, product reuse, fixed plan costs, API usage, evidence quality, and workflow handoffs. Product, plan, model, and access method are stored separately so a subscription is counted once even when several steps reuse it. Plans without a verified current price are labeled and excluded from the known-cost subtotal. Unsupported steps expose partial coverage and missing capabilities instead of being presented as complete.

Every catalog model and access product carries an AI-first classification (`AI_NATIVE`, `AI_CENTRIC`, `AI_ASSISTED`, or `TRADITIONAL`) plus its AI role, contribution level, automation level, and expected manual work. Primary recommendations require an AI-native or AI-centric classification and high AI contribution or automation. AI-assisted and traditional products remain outside the optimized AI subscription stack; missing capability coverage is reported honestly instead of being filled with manual production software.

When a changed evidence snapshot is stored, BENCHFLOW derives the affected task categories, queues only matching completed strategies, and evaluates them in the background. A saved plan is never overwritten automatically. The dashboard offers a refresh only for a material cost, quality, privacy, coverage, or product-count improvement; small benchmark fluctuations produce no alert. Newly discovered model entries remain `pending_evidence` until minimum identity, access, pricing, capability, and benchmark requirements are present. Curated AI products become eligible only when their official page still verifies every expected capability term.

See [BENCHMARK_SOURCES.md](./BENCHMARK_SOURCES.md) for source URLs, licenses, attribution, parser contracts, and unsupported-source reasons. `/admin/evidence` shows freshness, errors, counts, unchanged runs, unsupported sources, and the identity review queue.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

Credentialed Clerk, Convex, source, and Stripe journeys are gated by environment variables and skip locally instead of impersonating a real user.

## Anonymous trial flow

`POST /api/trial` creates an expiring trial and runs the same structured workflow planner used for saved strategies. `POST /api/trial/:id/recommend` runs the same deterministic recommendation engine and current evidence catalog. The opaque browser token is stored only in session storage; Convex stores its SHA-256 hash. `POST /api/trial/:id/save` requires Clerk authentication and atomically creates the user-owned saved strategy.

## Deployment

Deploy Convex first with the Clerk issuer, Clerk webhook signing and relay keys, evidence administrator emails, one complete planner provider pair, source credentials, and Stripe credentials in its environment. Deploy the frontend with its production Clerk publishable/secret keys, production Convex URL, and application URL; do not place planner or webhook keys in the frontend environment. Register production Clerk and Stripe webhooks, run supported evidence syncs, and inspect `/admin/evidence` before enabling recommendations.

Do not describe the evidence network as fully live unless Artificial Analysis, OpenRouter, at least one specialized benchmark, and official provider pricing have each completed a successful deployment sync.

## Known limitations

- Artificial Analysis cannot sync without its API key.
- Current explicit cross-source coverage is deliberately narrow; unmatched records wait for manual alias review.
- Stable official result artifacts were not verified for LiveCodeBench, SWE-bench, Open LLM Leaderboard, MMMU, MMBench, LongBench, or OpenCompass. They are visible as unsupported in diagnostics rather than simulated.
- Currency conversion for AUD and VND uses conservative planning constants in `lib/currency.ts`, not a current foreign-exchange feed.
- Material-improvement comparison is deterministic, but persistent user notifications still need a background notification channel.
