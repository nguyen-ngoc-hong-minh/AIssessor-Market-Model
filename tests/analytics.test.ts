import { describe, expect, it } from "vitest";
import { summarizeAnalytics } from "@/convex/analytics";

describe("analytics summaries", () => {
  it("reports visits, uniques, bounces, journeys, and interactions without user content", () => {
    const since = Date.UTC(2026, 7, 21);
    const now = Date.UTC(2026, 7, 22, 12);
    const sessions = [
      {
        sessionHash: "session-a", visitorHash: "visitor-a", actorType: "signed_in" as const,
        startedAt: since + 1_000, lastSeenAt: since + 20_000, entryPath: "/", exitPath: "/pricing", referrerDomain: "google.com",
        country: "VN", city: "Ho Chi Minh City", device: "Desktop", browser: "Chrome", pageViews: 2, meaningfulActions: 1,
        engagedMs: 12_000, maxScrollDepth: 80, pages: [{ path: "/", views: 1, engagedMs: 7_000 }, { path: "/pricing", views: 1, engagedMs: 5_000 }],
      },
      {
        sessionHash: "session-b", visitorHash: "visitor-a", actorType: "anonymous" as const,
        startedAt: now - 2_000, lastSeenAt: now - 1_000, entryPath: "/", exitPath: "/",
        country: "VN", device: "Mobile", browser: "Safari", pageViews: 1, meaningfulActions: 0,
        engagedMs: 1_000, maxScrollDepth: 10, pages: [{ path: "/", views: 1, engagedMs: 1_000 }],
      },
    ];
    const events = [
      { eventType: "click" as const, path: "/", targetLabel: "See pricing", device: "Desktop", browser: "Chrome", occurredAt: now },
      { eventType: "page_view" as const, path: "/pricing", fromPath: "/", device: "Desktop", browser: "Chrome", occurredAt: now - 1 },
    ];
    const result = summarizeAnalytics(sessions, events, since, now);
    expect(result.summary).toMatchObject({ visits: 2, uniqueVisitors: 1, pageViews: 3, bounceRate: 50, averageEngagementMs: 6_500, medianEngagementMs: 6_500, longestEngagementMs: 12_000, totalEngagementMs: 13_000, signedInSessions: 1 });
    expect(result.stayTime).toContainEqual({ label: "Under 10 seconds", count: 1, percentage: 50 });
    expect(result.stayTime).toContainEqual({ label: "10–30 seconds", count: 1, percentage: 50 });
    expect(result.pages[0]).toMatchObject({ path: "/", views: 2, entries: 2, exits: 1 });
    expect(result.acquisition).toContainEqual({ label: "google.com", count: 1 });
    expect(result.journeys[0]).toEqual({ label: "/ → /pricing", count: 1 });
    expect(result.interactions[0]).toEqual({ label: "See pricing · /", count: 1 });
    expect(result.daily).toHaveLength(2);
  });
});
