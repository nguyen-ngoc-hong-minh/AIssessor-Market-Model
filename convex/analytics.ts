import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const eventType = v.union(v.literal("page_view"), v.literal("engagement"), v.literal("click"), v.literal("form_submit"));
const actorType = v.union(v.literal("anonymous"), v.literal("signed_in"));
const text = (value: string | undefined, fallback = "") => (value ?? fallback).trim().slice(0, 160);
const clamp = (value: number | undefined, min: number, max: number) => Math.max(min, Math.min(max, value ?? min));

export const record = mutation({
  args: {
    sessionHash: v.string(), visitorHash: v.string(), actorHash: v.optional(v.string()), actorType,
    eventType, path: v.string(), fromPath: v.optional(v.string()), toPath: v.optional(v.string()), referrerDomain: v.optional(v.string()),
    targetLabel: v.optional(v.string()), targetType: v.optional(v.string()), durationMs: v.optional(v.number()), scrollDepth: v.optional(v.number()),
    country: v.optional(v.string()), region: v.optional(v.string()), city: v.optional(v.string()), device: v.string(), browser: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionHash = text(args.sessionHash);
    const visitorHash = text(args.visitorHash);
    const path = text(args.path, "/");
    if (sessionHash.length < 32 || visitorHash.length < 32 || !path.startsWith("/")) return { accepted: false };

    const existing = await ctx.db.query("analyticsSessions").withIndex("by_session_hash", (q) => q.eq("sessionHash", sessionHash)).unique();
    const sameRateWindow = Boolean(existing && now - existing.rateWindowStartedAt < 60_000);
    const rateWindowCount = sameRateWindow ? (existing?.rateWindowCount ?? 0) + 1 : 1;
    if (rateWindowCount > 120) return { accepted: false };
    const durationMs = args.eventType === "engagement" ? clamp(args.durationMs, 0, 60_000) : 0;
    const scrollDepth = clamp(args.scrollDepth, 0, 100);
    const meaningful = args.eventType === "click" || args.eventType === "form_submit" ? 1 : 0;
    const pageView = args.eventType === "page_view" ? 1 : 0;
    const pages = [...(existing?.pages ?? [])];
    const pageIndex = pages.findIndex((page) => page.path === path);
    if (pageIndex >= 0) pages[pageIndex] = { ...pages[pageIndex], views: pages[pageIndex].views + pageView, engagedMs: pages[pageIndex].engagedMs + durationMs };
    else if (pages.length < 40) pages.push({ path, views: pageView, engagedMs: durationMs });

    const values = {
      sessionHash, visitorHash, actorHash: args.actorHash, actorType: args.actorType,
      startedAt: existing?.startedAt ?? now, lastSeenAt: now,
      entryPath: existing?.entryPath ?? path, exitPath: pageView ? path : existing?.exitPath ?? path,
      referrerDomain: existing?.referrerDomain ?? (text(args.referrerDomain) || undefined),
      country: existing?.country ?? (text(args.country) || undefined), region: existing?.region ?? (text(args.region) || undefined),
      city: existing?.city ?? (text(args.city) || undefined), device: text(args.device, "Unknown"), browser: text(args.browser, "Unknown"),
      pageViews: (existing?.pageViews ?? 0) + pageView, eventCount: (existing?.eventCount ?? 0) + 1,
      meaningfulActions: (existing?.meaningfulActions ?? 0) + meaningful, engagedMs: (existing?.engagedMs ?? 0) + durationMs,
      maxScrollDepth: Math.max(existing?.maxScrollDepth ?? 0, scrollDepth),
      rateWindowStartedAt: sameRateWindow ? existing?.rateWindowStartedAt ?? now : now, rateWindowCount, pages,
    };
    if (existing) await ctx.db.patch(existing._id, values);
    else await ctx.db.insert("analyticsSessions", values);

    if (args.eventType !== "engagement") await ctx.db.insert("analyticsEvents", {
      sessionHash, visitorHash, actorType: args.actorType, eventType: args.eventType, path,
      fromPath: text(args.fromPath) || undefined, toPath: text(args.toPath) || undefined, referrerDomain: text(args.referrerDomain) || undefined,
      targetLabel: text(args.targetLabel) || undefined, targetType: text(args.targetType) || undefined,
      durationMs: args.durationMs === undefined ? undefined : durationMs, scrollDepth,
      country: text(args.country) || undefined, region: text(args.region) || undefined, city: text(args.city) || undefined,
      device: text(args.device, "Unknown"), browser: text(args.browser, "Unknown"), occurredAt: now,
    });
    return { accepted: true };
  },
});

type AnalyticsSession = {
  sessionHash: string; visitorHash: string; actorType: "anonymous" | "signed_in"; startedAt: number; lastSeenAt: number;
  entryPath: string; exitPath: string; referrerDomain?: string; country?: string; region?: string; city?: string;
  device: string; browser: string; pageViews: number; meaningfulActions: number; engagedMs: number; maxScrollDepth: number;
  pages: Array<{ path: string; views: number; engagedMs: number }>;
};
type AnalyticsEvent = {
  eventType: "page_view" | "engagement" | "click" | "form_submit"; path: string; fromPath?: string; toPath?: string;
  targetLabel?: string; targetType?: string; country?: string; city?: string; device: string; browser: string; occurredAt: number;
};

function ranked<T>(values: T[], key: (value: T) => string, limit = 10) {
  const counts = new Map<string, number>();
  for (const value of values) { const label = key(value) || "Unknown"; counts.set(label, (counts.get(label) ?? 0) + 1); }
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, limit);
}

export function summarizeAnalytics(sessions: AnalyticsSession[], events: AnalyticsEvent[], since: number, now: number) {
  const uniqueVisitors = new Set(sessions.map((session) => session.visitorHash)).size;
  const pageViews = sessions.reduce((sum, session) => sum + session.pageViews, 0);
  const engagedMs = sessions.reduce((sum, session) => sum + session.engagedMs, 0);
  const visitTimes = sessions.map((session) => session.engagedMs).sort((a, b) => a - b);
  const medianEngagementMs = visitTimes.length ? visitTimes.length % 2
    ? visitTimes[Math.floor(visitTimes.length / 2)]
    : Math.round((visitTimes[visitTimes.length / 2 - 1] + visitTimes[visitTimes.length / 2]) / 2) : 0;
  const stayRanges = [
    { label: "Under 10 seconds", min: 0, max: 10_000 },
    { label: "10–30 seconds", min: 10_000, max: 30_000 },
    { label: "30 seconds–2 minutes", min: 30_000, max: 120_000 },
    { label: "2–5 minutes", min: 120_000, max: 300_000 },
    { label: "5+ minutes", min: 300_000, max: Number.POSITIVE_INFINITY },
  ];
  const bounces = sessions.filter((session) => session.pageViews <= 1 && session.meaningfulActions === 0 && session.engagedMs < 10_000).length;
  const pageMap = new Map<string, { path: string; views: number; engagedMs: number; entries: number; exits: number }>();
  for (const session of sessions) {
    for (const page of session.pages) {
      const current = pageMap.get(page.path) ?? { path: page.path, views: 0, engagedMs: 0, entries: 0, exits: 0 };
      current.views += page.views; current.engagedMs += page.engagedMs;
      pageMap.set(page.path, current);
    }
    const entry = pageMap.get(session.entryPath) ?? { path: session.entryPath, views: 0, engagedMs: 0, entries: 0, exits: 0 };
    entry.entries += 1; pageMap.set(session.entryPath, entry);
    const exit = pageMap.get(session.exitPath) ?? { path: session.exitPath, views: 0, engagedMs: 0, entries: 0, exits: 0 };
    exit.exits += 1; pageMap.set(session.exitPath, exit);
  }
  const dayCount = Math.max(1, Math.floor((Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate()) - since) / 86_400_000) + 1);
  const daily = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(since + index * 86_400_000).toISOString().slice(0, 10);
    return { date, visits: 0, pageViews: 0, uniqueVisitors: 0 };
  });
  const dailyVisitors = new Map<string, Set<string>>();
  for (const session of sessions) {
    const date = new Date(session.startedAt).toISOString().slice(0, 10);
    const day = daily.find((item) => item.date === date);
    if (!day) continue;
    day.visits += 1; day.pageViews += session.pageViews;
    const visitors = dailyVisitors.get(date) ?? new Set<string>(); visitors.add(session.visitorHash); dailyVisitors.set(date, visitors);
  }
  for (const day of daily) day.uniqueVisitors = dailyVisitors.get(day.date)?.size ?? 0;

  const journeys = events.filter((event) => event.eventType === "page_view" && event.fromPath && event.fromPath !== event.path);
  const interactions = events.filter((event) => event.eventType === "click" || event.eventType === "form_submit");
  return {
    summary: {
      visits: sessions.length, uniqueVisitors, pageViews,
      bounceRate: sessions.length ? Math.round((bounces / sessions.length) * 1000) / 10 : 0,
      averageEngagementMs: sessions.length ? Math.round(engagedMs / sessions.length) : 0,
      medianEngagementMs, longestEngagementMs: visitTimes.at(-1) ?? 0, totalEngagementMs: engagedMs,
      signedInSessions: sessions.filter((session) => session.actorType === "signed_in").length,
    },
    stayTime: stayRanges.map((range) => {
      const count = visitTimes.filter((value) => value >= range.min && value < range.max).length;
      return { label: range.label, count, percentage: sessions.length ? Math.round((count / sessions.length) * 1000) / 10 : 0 };
    }),
    daily,
    pages: [...pageMap.values()].map((page) => ({ ...page, averageEngagementMs: page.views ? Math.round(page.engagedMs / page.views) : 0 })).sort((a, b) => b.views - a.views).slice(0, 12),
    acquisition: ranked(sessions, (session) => session.referrerDomain || "Direct"),
    locations: ranked(sessions, (session) => [session.city, session.country].filter(Boolean).join(", ") || "Unknown"),
    devices: ranked(sessions, (session) => `${session.device} · ${session.browser}`),
    journeys: ranked(journeys, (event) => `${event.fromPath} → ${event.path}`),
    interactions: ranked(interactions, (event) => `${event.targetLabel || event.targetType || event.eventType} · ${event.path}`, 15),
    recentActivity: events.slice(0, 60).map((event) => ({ ...event })),
  };
}

export const dashboard = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const days = Math.max(1, Math.min(90, Math.round(args.days)));
    const now = Date.now();
    const today = new Date(now);
    const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const since = todayStart - (days - 1) * 86_400_000;
    const sessionLimit = 4_000;
    const eventLimit = 2_000;
    const sessions = await ctx.db.query("analyticsSessions").withIndex("by_started_at", (q) => q.gte("startedAt", since)).order("desc").take(sessionLimit);
    const events = await ctx.db.query("analyticsEvents").withIndex("by_occurred_at", (q) => q.gte("occurredAt", since)).order("desc").take(eventLimit);
    return { ...summarizeAnalytics(sessions, events, since, now), range: { days, since, now }, sampled: sessions.length === sessionLimit || events.length === eventLimit };
  },
});
