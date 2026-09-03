import { apiError, authenticatedConvex } from "@/lib/server/convex";
import { approveThenGenerate } from "@/lib/server/workflow-generation";

export async function POST(_: Request, { params }: { params: Promise<{ strategyId: string }> }) {
  try {
    const { strategyId } = await params;
    const client = await authenticatedConvex();
    const result = await approveThenGenerate(client, strategyId);
    return Response.json({ ok: true, result });
  } catch (error) {
    return apiError(error);
  }
}
