import { anyApi } from "convex/server";
import { StrategyInputSchema } from "@/lib/planner/schema";
import { apiError } from "@/lib/server/convex";
import { createTrialToken, hashTrialToken, publicConvex } from "@/lib/server/trial";

export async function POST(request: Request) {
  try {
    const input = StrategyInputSchema.parse(await request.json());
    const token = createTrialToken();
    const tokenHash = hashTrialToken(token);
    const client = publicConvex();
    const trialId = await client.mutation(anyApi.trials.create, { tokenHash, input });
    const analysis = await client.action(anyApi.actions.trial.analyse, { trialId, tokenHash });
    return Response.json({ trialId, token, analysis });
  } catch (error) {
    return apiError(error);
  }
}
