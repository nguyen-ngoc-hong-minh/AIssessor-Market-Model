import { mutationGeneric as mutation } from "convex/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";

const accountType = v.union(v.literal("individual"), v.literal("team"), v.literal("enterprise"));

export const completeOnboarding = mutation({
  args: {
    accountType,
    profession: v.optional(v.string()), industry: v.string(), teamSize: v.optional(v.string()), companySize: v.optional(v.string()),
    departments: v.optional(v.array(v.string())), country: v.string(), preferredLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx); const now = Date.now();
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
    const values = {
      userId: user._id, profession: args.profession, industry: args.industry, teamSize: args.teamSize,
      companySize: args.companySize, departments: args.departments, country: args.country,
      preferredLanguage: args.preferredLanguage, updatedAt: now,
    };
    if (profile) await ctx.db.patch(profile._id, values); else await ctx.db.insert("profiles", values);
    await ctx.db.patch(user._id, { accountType: args.accountType, onboardingComplete: true, preferredLanguage: args.preferredLanguage, updatedAt: now });
  },
});

export const updateCurrent = mutation({
  args: {
    accountType,
    profession: v.optional(v.string()), industry: v.string(), teamSize: v.optional(v.string()), companySize: v.optional(v.string()),
    departments: v.optional(v.array(v.string())), country: v.string(), preferredLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx); const now = Date.now();
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
    const values = { userId: user._id, profession: args.profession, industry: args.industry, teamSize: args.teamSize, companySize: args.companySize, departments: args.departments, country: args.country, preferredLanguage: args.preferredLanguage, updatedAt: now };
    if (profile) await ctx.db.patch(profile._id, values); else await ctx.db.insert("profiles", values);
    await ctx.db.patch(user._id, { accountType: args.accountType, preferredLanguage: args.preferredLanguage, updatedAt: now });
  },
});
