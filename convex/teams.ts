import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";

export const mine = query({ args: {}, handler: async (ctx) => {
  const user = await requireUser(ctx);
  const memberships = await ctx.db.query("teamMembers").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  return Promise.all(memberships.map(async (membership) => ({ membership, team: await ctx.db.get(membership.teamId) })));
} });

export const create = mutation({ args: { name: v.string() }, handler: async (ctx, args) => {
  const { name } = args; const user = await requireUser(ctx); const subscription = await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
  if (!subscription || subscription.plan !== "team" || !["active", "trialing"].includes(subscription.status)) throw new Error("An active Team subscription is required");
  const teamId = await ctx.db.insert("teams", { ownerId: user._id, name, createdAt: Date.now() });
  await ctx.db.insert("teamMembers", { teamId, userId: user._id, role: "owner", createdAt: Date.now() }); return teamId;
} });
