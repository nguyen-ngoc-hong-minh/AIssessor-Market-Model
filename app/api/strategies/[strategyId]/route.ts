import { anyApi } from "convex/server";
import { z } from "zod";
import { apiError, authenticatedConvex } from "@/lib/server/convex";

const WorkflowSchema=z.object({steps:z.array(z.object({order:z.number(),name:z.string().min(2),description:z.string().min(2),requirements:z.record(z.string(),z.unknown()),estimates:z.record(z.string(),z.unknown())}))});
export async function GET(_:Request,{params}:{params:Promise<{strategyId:string}>}){try{const {strategyId}=await params;const client=await authenticatedConvex();return Response.json(await client.query(anyApi.strategies.getOwned,{strategyId}));}catch(error){return apiError(error)}}
export async function PUT(request:Request,{params}:{params:Promise<{strategyId:string}>}){try{const {strategyId}=await params;const input=WorkflowSchema.parse(await request.json());const client=await authenticatedConvex();await client.mutation(anyApi.strategies.replaceWorkflow,{strategyId,steps:input.steps});return Response.json({ok:true});}catch(error){return apiError(error)}}
export async function DELETE(_:Request,{params}:{params:Promise<{strategyId:string}>}){try{const {strategyId}=await params;const client=await authenticatedConvex();await client.mutation(anyApi.strategies.remove,{strategyId});return Response.json({ok:true});}catch(error){return apiError(error)}}
