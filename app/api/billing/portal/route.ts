import { anyApi } from "convex/server";
import { apiError, authenticatedConvex } from "@/lib/server/convex";
export async function POST(){try{const client=await authenticatedConvex();return Response.json({url:await client.action(anyApi.actions.billing.createPortal,{})});}catch(error){return apiError(error)}}
