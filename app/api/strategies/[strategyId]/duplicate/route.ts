import { anyApi } from "convex/server";
import { apiError, authenticatedConvex } from "@/lib/server/convex";

export async function POST(_: Request, { params }: { params: Promise<{ strategyId: string }> }) {
  try {
    const { strategyId } = await params;
    const client = await authenticatedConvex();
    const duplicateId = await client.mutation(anyApi.strategies.duplicate, { strategyId });
    return Response.json({ strategyId: duplicateId });
  } catch (error) {
    return apiError(error);
  }
}
