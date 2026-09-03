import { anyApi } from "convex/server";
import { z } from "zod";
import { WorkflowStepSchema } from "@/lib/planner/schema";
import { apiError } from "@/lib/server/convex";
import { hashTrialToken, publicConvex } from "@/lib/server/trial";

const bodySchema = z.object({ token: z.string().min(32).max(100), workflowSteps: z.array(WorkflowStepSchema).min(1).max(20) });

export async function POST(request: Request, { params }: { params: Promise<{ trialId: string }> }) {
  try {
    const { trialId } = await params;
    const body = bodySchema.parse(await request.json());
    const result = await publicConvex().action(anyApi.actions.trial.recommend, {
      trialId, tokenHash: hashTrialToken(body.token), workflowSteps: body.workflowSteps,
    });
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
