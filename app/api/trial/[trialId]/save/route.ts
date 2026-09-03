import { anyApi } from "convex/server";
import { z } from "zod";
import { apiError, authenticatedConvex } from "@/lib/server/convex";
import { hashTrialToken } from "@/lib/server/trial";

const bodySchema = z.object({ token: z.string().min(32).max(100) });

export async function POST(request: Request, { params }: { params: Promise<{ trialId: string }> }) {
  try {
    const { trialId } = await params;
    const body = bodySchema.parse(await request.json());
    const client = await authenticatedConvex();
    const strategyId = await client.mutation(anyApi.trials.claim, { trialId, tokenHash: hashTrialToken(body.token) });
    return Response.json({ strategyId });
  } catch (error) {
    return apiError(error);
  }
}
