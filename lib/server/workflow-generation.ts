import { anyApi } from "convex/server";
import type { AuthenticatedConvexClient } from "./convex";

export async function approveThenGenerate(client: AuthenticatedConvexClient, strategyId: string) {
  await client.mutation(anyApi.strategies.approveWorkflow, { strategyId });
  return client.action(anyApi.actions.recommend.generate, { strategyId, region: "global" });
}

export async function generateMonthlyRecommendations(
  client: AuthenticatedConvexClient,
  strategyId: string,
  usageType: "one_off" | "monthly",
) {
  if (usageType !== "monthly") return null;
  return approveThenGenerate(client, strategyId);
}
