import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { requireIdentity, requireUser } from "./lib/auth";

export const current = query({ args: {}, handler: async (ctx) => {
  const user = await requireUser(ctx);
  const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
  return { user, profile };
} });

export const ensureCurrent = mutation({ args: {}, handler: async (ctx) => {
  const identity = await requireIdentity(ctx);
  const now = Date.now();
  const existing = await ctx.db.query("users").withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject)).unique();
  if (existing) {
    await ctx.db.patch(existing._id, {
      email: identity.email?.toLowerCase() ?? existing.email,
      name: identity.name ?? existing.name,
      avatarUrl: identity.pictureUrl ?? existing.avatarUrl,
      deletedAt: undefined,
      updatedAt: now,
    });
    return existing._id;
  }
  return ctx.db.insert("users", {
    clerkUserId: identity.subject,
    email: identity.email?.toLowerCase() ?? `${identity.subject}@clerk.invalid`,
    name: identity.name,
    avatarUrl: identity.pictureUrl,
    onboardingComplete: false,
    preferredLanguage: "English",
    createdAt: now,
    updatedAt: now,
  });
} });

export const syncFromClerkWebhook = mutation({
  args: {
    syncKey: v.string(), eventId: v.string(), eventType: v.union(v.literal("user.created"), v.literal("user.updated"), v.literal("user.deleted")),
    clerkUserId: v.string(), email: v.optional(v.string()), displayName: v.optional(v.string()), avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!process.env.CLERK_WEBHOOK_SYNC_KEY || args.syncKey !== process.env.CLERK_WEBHOOK_SYNC_KEY) throw new Error("Unauthenticated webhook relay");
    const replay = (await ctx.db.query("webhookEvents").collect()).find((item) => item.provider === "clerk" && item.eventId === args.eventId);
    if (replay) return { duplicate: true };
    const now = Date.now();
    const existing = await ctx.db.query("users").withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId)).unique();
    if (args.eventType === "user.deleted") {
      if (existing) await ctx.db.patch(existing._id, { deletedAt: now, updatedAt: now });
    } else if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email?.toLowerCase() ?? existing.email,
        name: args.displayName ?? existing.name,
        avatarUrl: args.avatarUrl ?? existing.avatarUrl,
        deletedAt: undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("users", {
        clerkUserId: args.clerkUserId,
        email: args.email?.toLowerCase() ?? `${args.clerkUserId}@clerk.invalid`,
        name: args.displayName,
        avatarUrl: args.avatarUrl,
        onboardingComplete: false,
        preferredLanguage: "English",
        createdAt: now,
        updatedAt: now,
      });
    }
    await ctx.db.insert("webhookEvents", { provider: "clerk", eventId: args.eventId, eventType: args.eventType, processedAt: now });
    return { duplicate: false };
  },
});
