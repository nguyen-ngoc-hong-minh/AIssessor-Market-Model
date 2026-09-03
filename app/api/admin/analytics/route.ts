import { anyApi } from "convex/server";
import { apiError, authenticatedConvex } from "@/lib/server/convex";

export async function GET(request: Request) {
  try {
    const days = Math.max(1, Math.min(90, Number(new URL(request.url).searchParams.get("days")) || 30));
    const client = await authenticatedConvex();
    return Response.json(await client.query(anyApi.analytics.dashboard, { days }));
  } catch (error) { return apiError(error); }
}
