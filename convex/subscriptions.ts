import { internalMutationGeneric as internalMutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";
import { subscriptionEntitlements } from "../lib/billing/entitlements";

export const entitlement = query({ args: {}, handler: async (ctx) => {
  const user = await requireUser(ctx); const subscription = await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
  return subscriptionEntitlements(subscription ? { plan: subscription.plan, status: subscription.status } : null);
} });

export const forCurrentUser = query({ args: {}, handler: async (ctx) => { const user = await requireUser(ctx); return ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", user._id)).unique(); } });

export const upsertVerified = internalMutation({
  args: { clerkUserId: v.string(), stripeCustomerId: v.string(), stripeSubscriptionId: v.optional(v.string()), stripePriceId: v.optional(v.string()), plan: v.union(v.literal("free"), v.literal("plus"), v.literal("team"), v.literal("enterprise")), status: v.string(), currentPeriodEnd: v.optional(v.number()), cancelAtPeriodEnd: v.boolean() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId)).unique();
    if (!user) throw new Error("Unknown user");
    const existing = await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
    const values = { userId: user._id, stripeCustomerId: args.stripeCustomerId, stripeSubscriptionId: args.stripeSubscriptionId, stripePriceId: args.stripePriceId, plan: args.plan, status: args.status, currentPeriodEnd: args.currentPeriodEnd, cancelAtPeriodEnd: args.cancelAtPeriodEnd, updatedAt: Date.now() };
    if (existing) { await ctx.db.patch(existing._id, values); return existing._id; }
    return ctx.db.insert("subscriptions", values);
  },
});
