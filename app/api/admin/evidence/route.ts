import { anyApi } from "convex/server";
import { apiError, authenticatedConvex } from "@/lib/server/convex";

export async function GET() {
  try {
    const client = await authenticatedConvex();
    return Response.json(await client.query(anyApi.modelSync.diagnostics, {}));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { source?: string };
    if (!body.source) return Response.json({ error: "Source is required" }, { status: 400 });
    const client = await authenticatedConvex();
    const snapshotId = await client.action(anyApi.actions.syncModels.syncNow, { source: body.source });
    return Response.json({ snapshotId });
  } catch (error) {
    return apiError(error);
  }
}
