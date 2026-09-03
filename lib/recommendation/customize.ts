import type { CandidateScore, StrategyPlan, SubscriptionSummary } from "./types";

function productIdentity(tool: CandidateScore["tools"][number]) {
  const access = tool.access;
  const productName = access.productName ?? tool.model.provider;
  return {
    key: access.productId ?? `${tool.model.provider}:${productName}:${access.planName ?? access.accessMethod ?? "access"}`.toLowerCase(),
    productName,
    planName: access.planName ?? (access.accessMethod === "api" ? "Usage based API" : "Standard access"),
    accessMethod: access.accessMethod ?? "api" as const,
    monthlyPriceUsd: access.monthlyPriceUsd ?? null,
    accessUrl: access.url,
  };
}

function owned(existingTools: string[], tool: CandidateScore["tools"][number]) {
  const identity = productIdentity(tool);
  const haystack = `${identity.productName} ${identity.planName} ${tool.model.provider} ${tool.model.name}`.toLowerCase();
  return tool.model.existingTool || existingTools.some((item) => haystack.includes(item.toLowerCase()));
}

export function candidateId(candidate: CandidateScore | null) {
  if (!candidate) return "none";
  return candidate.tools
    .map((tool) => `${tool.model.canonicalId ?? tool.model.id}:${tool.access.productId ?? tool.access.modelId}`)
    .sort()
    .join("+");
}

export function availableCandidates(step: StrategyPlan["steps"][number]) {
  const candidates = [
    step.selected,
    ...Object.values(step.options),
    ...step.alternatives,
    ...step.partialOptions,
  ].filter((candidate): candidate is CandidateScore => candidate !== null);
  return candidates.filter((candidate, index) => candidates.findIndex((other) => candidateId(other) === candidateId(candidate)) === index);
}

function subscriptionSummary(steps: StrategyPlan["steps"], existingTools: string[]) {
  const summaries = new Map<string, SubscriptionSummary>();
  for (const step of steps) for (const tool of step.selected?.tools ?? []) {
    const identity = productIdentity(tool);
    const existing = summaries.get(identity.key);
    const alreadyOwned = owned(existingTools, tool);
    const next: SubscriptionSummary = existing ?? {
      productId: identity.key,
      productName: identity.productName,
      planName: identity.planName,
      accessMethod: identity.accessMethod,
      priceUsd: identity.monthlyPriceUsd,
      accessUrl: identity.accessUrl,
      stepIds: [],
      stepNames: [],
      modelNames: [],
      alreadyOwned,
      additionalCostUsd: alreadyOwned || identity.accessMethod !== "product" ? 0 : identity.monthlyPriceUsd,
      apiUsageEstimateUsd: 0,
    };
    if (!next.stepIds.includes(step.stepId)) next.stepIds.push(step.stepId);
    if (!next.stepNames.includes(step.step.name)) next.stepNames.push(step.step.name);
    if (!next.modelNames.includes(tool.model.name)) next.modelNames.push(tool.model.name);
    next.apiUsageEstimateUsd = Number((next.apiUsageEstimateUsd + tool.estimatedCostUsd).toFixed(4));
    summaries.set(identity.key, next);
  }
  return [...summaries.values()].sort((a, b) => (a.additionalCostUsd ?? Number.POSITIVE_INFINITY) - (b.additionalCostUsd ?? Number.POSITIVE_INFINITY) || a.productName.localeCompare(b.productName));
}

export function customizeStrategyPlan(plan: StrategyPlan, selections: Record<string, string>): StrategyPlan {
  if (!Object.keys(selections).length) return plan;
  const steps = plan.steps.map((step) => {
    const requested = selections[step.stepId];
    if (!requested) return step;
    const selected = availableCandidates(step).find((candidate) => candidateId(candidate) === requested);
    return selected ? { ...step, selected } : step;
  });
  const existingTools = plan.inputsUsed?.existingTools ?? [];
  const subscriptions = subscriptionSummary(steps, existingTools);
  const fixedCostUsd = Number(subscriptions.reduce((sum, item) => sum + (item.additionalCostUsd ?? 0), 0).toFixed(2));
  const apiCostUsd = Number(steps.reduce((sum, item) => sum + (item.selected?.estimatedCostUsd ?? 0), 0).toFixed(2));
  const totalCostUsd = Number((fixedCostUsd + apiCostUsd).toFixed(2));
  const estimatedSavingsUsd = Number(steps.reduce((sum, item) => sum + (item.selected?.estimatedSavingsUsd ?? 0), 0).toFixed(2));
  const completeStepCount = steps.filter((item) => item.step.noAIEligible || (item.selected && item.selected.missingCapabilities.length === 0)).length;
  const budgetUsd = plan.budgetUsd;
  const overBudgetUsd = budgetUsd === null ? 0 : Number(Math.max(0, totalCostUsd - budgetUsd).toFixed(2));
  const hasUnknownSubscriptionPricing = subscriptions.some((subscription) => subscription.accessMethod === "product" && !subscription.alreadyOwned && subscription.priceUsd === null);
  const budgetCompatible = budgetUsd === null || (!hasUnknownSubscriptionPricing && totalCostUsd <= budgetUsd + 0.0001 && completeStepCount === steps.length);
  const budgetRemainingUsd = budgetUsd === null ? null : Number(Math.max(0, budgetUsd - totalCostUsd).toFixed(2));
  const kept = existingTools.filter((tool) => subscriptions.some((subscription) => `${subscription.productName} ${subscription.planName} ${subscription.modelNames.join(" ")}`.toLowerCase().includes(tool.toLowerCase())));
  return {
    ...plan,
    steps,
    subscriptions,
    fixedCostUsd,
    apiCostUsd,
    totalCostUsd,
    estimatedSavingsUsd,
    existingSubscriptions: { kept, couldCancel: existingTools.filter((tool) => !kept.includes(tool)) },
    uniqueProductCount: subscriptions.length,
    completeStepCount,
    overBudgetUsd,
    hasUnknownSubscriptionPricing,
    budgetCompatible,
    budgetRemainingUsd,
  };
}
