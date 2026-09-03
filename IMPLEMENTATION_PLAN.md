# BENCHFLOW implementation plan

## Completed in this update

1. Replaced hosting-header identity with Clerk and official Clerk/Convex JWT verification.
2. Added replay-safe Clerk user synchronization and soft deletion.
3. Moved stakeholder onboarding behind account creation and added stakeholder-specific profile fields.
4. Split one-off project input from the monthly multi-task workload builder.
5. Expanded evidence normalization, task-aware scoring, source disclosure, and explicit failure states.
6. Added authorization, webhook, form, scoring, attribution, and subscription-reuse tests.

## Production gates

1. Configure Clerk email, Google, Apple, verification, recovery, and deletion settings.
2. Configure Clerk keys and issuer domain in the frontend and Convex environments.
3. Deploy Convex functions and register the Clerk and Stripe webhooks.
4. Configure source credentials, run initial syncs, and inspect minimum evidence coverage.
5. Run credentialed Clerk/Convex/Stripe E2E tests against staging.
6. Add source-specific adapters for the benchmark sources listed in `BENCHMARK_AUDIT.md`.
7. Add a background evaluator that persists new-model refresh opportunities for saved strategies.
