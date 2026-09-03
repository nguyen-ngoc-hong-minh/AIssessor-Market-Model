import { anyApi } from "convex/server";
import { z } from "zod";
import { apiError, authenticatedConvex } from "@/lib/server/convex";
export async function POST(request:Request){try{const {plan}=z.object({plan:z.enum(["plus","team"])}).parse(await request.json());const client=await authenticatedConvex();return Response.json({url:await client.action(anyApi.actions.billing.createCheckout,{plan})});}catch(error){return apiError(error)}}
