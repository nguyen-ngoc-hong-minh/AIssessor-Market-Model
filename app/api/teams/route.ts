import { anyApi } from "convex/server";
import { z } from "zod";
import { apiError, authenticatedConvex } from "@/lib/server/convex";
export async function GET(){try{const client=await authenticatedConvex();return Response.json(await client.query(anyApi.teams.mine,{}));}catch(error){return apiError(error)}}
export async function POST(request:Request){try{const {name}=z.object({name:z.string().min(2).max(80)}).parse(await request.json());const client=await authenticatedConvex();return Response.json({teamId:await client.mutation(anyApi.teams.create,{name})});}catch(error){return apiError(error)}}
