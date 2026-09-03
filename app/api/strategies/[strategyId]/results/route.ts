import { anyApi } from "convex/server";
import { apiError, authenticatedConvex } from "@/lib/server/convex";
export async function GET(_: Request, { params }: { params: Promise<{ strategyId: string }> }) {
  try {
    const { strategyId } = await params;
    const client = await authenticatedConvex();
    const saved = await client.action(anyApi.actions.recommend.loadSaved, { strategyId });
    return Response.json(saved ?? await client.action(anyApi.actions.recommend.generate, { strategyId, region: "global" }));
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ strategyId: string }> }) {
  try {
    const { strategyId } = await params;
    const payload = await request.json() as { selections?: Array<{ stepId?: string; candidateId?: string }> };
    const selections = (Array.isArray(payload.selections) ? payload.selections : []).map((selection) => ({
      stepId: String(selection.stepId ?? ""),
      candidateId: String(selection.candidateId ?? ""),
    })).filter((selection) => selection.stepId && selection.candidateId);
    if (!selections.length) return Response.json({ error: "Choose at least one model" }, { status: 400 });
    const client = await authenticatedConvex();
    return Response.json(await client.mutation(anyApi.strategies.customizePlan, { strategyId, selections }));
  } catch (error) {
    return apiError(error);
  }
}
