"use client";

import { Activity, ArrowRight, Clock3, Eye, MousePointerClick, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Ranked = { label: string; count: number };
type AnalyticsData = {
  summary: { visits: number; uniqueVisitors: number; pageViews: number; bounceRate: number; averageEngagementMs: number; medianEngagementMs: number; longestEngagementMs: number; totalEngagementMs: number; signedInSessions: number };
  stayTime: Array<{ label: string; count: number; percentage: number }>;
  daily: Array<{ date: string; visits: number; pageViews: number; uniqueVisitors: number }>;
  pages: Array<{ path: string; views: number; entries: number; exits: number; averageEngagementMs: number }>;
  acquisition: Ranked[]; locations: Ranked[]; devices: Ranked[]; journeys: Ranked[]; interactions: Ranked[];
  recentActivity: Array<{ eventType: string; path: string; fromPath?: string; toPath?: string; targetLabel?: string; targetType?: string; country?: string; city?: string; device: string; browser: string; occurredAt: number }>;
  range: { days: number; since: number; now: number }; sampled: boolean;
};

function duration(ms: number) {
  if (ms < 1_000) return "<1s";
  const seconds = Math.round(ms / 1_000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes}m ${seconds % 60}s` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
function number(value: number) { return new Intl.NumberFormat().format(value); }
function eventLabel(event: AnalyticsData["recentActivity"][number]) {
  if (event.eventType === "page_view") return `Viewed ${event.path}`;
  if (event.eventType === "form_submit") return `Submitted ${event.targetLabel || "form"}`;
  return `Pressed ${event.targetLabel || event.targetType || "control"}`;
}

function Ranking({ title, subtitle, rows }: { title: string; subtitle: string; rows: Ranked[] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return <section className="analytics-panel"><header><div><h2>{title}</h2><p>{subtitle}</p></div></header><div className="analytics-ranking">{rows.length ? rows.map((row) => <div key={row.label} className="analytics-rank-row"><div><strong title={row.label}>{row.label}</strong><span>{number(row.count)}</span></div><i style={{ width: `${Math.max(5, (row.count / max) * 100)}%` }} /></div>) : <p className="analytics-empty">No activity recorded in this range yet.</p>}</div></section>;
}

export function AnalyticsAdmin() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/analytics?days=${days}`, { cache: "no-store" });
      const body = await response.json() as AnalyticsData | { error?: string };
      if (!response.ok) throw new Error("error" in body ? body.error ?? "Analytics unavailable" : "Analytics unavailable");
      setData(body as AnalyticsData);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Analytics unavailable"); }
    finally { setLoading(false); }
  }, [days]);
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/analytics?days=${days}`, { cache: "no-store" }).then(async (response) => {
      const body = await response.json() as AnalyticsData | { error?: string };
      if (!response.ok) throw new Error("error" in body ? body.error ?? "Analytics unavailable" : "Analytics unavailable");
      return body as AnalyticsData;
    }).then((body) => { if (active) { setData(body); setError(""); setLoading(false); } })
      .catch((reason) => { if (active) { setError(reason instanceof Error ? reason.message : "Analytics unavailable"); setLoading(false); } });
    return () => { active = false; };
  }, [days]);

  if (!data && loading) return <div className="analytics-loading"><RefreshCw className="spin" />Loading website analytics…</div>;
  if (!data) return <div className="analytics-loading analytics-error">{error || "Analytics unavailable"}<button onClick={() => void load()}>Try again</button></div>;
  const maxDaily = Math.max(...data.daily.map((day) => day.visits), 1);
  const signedInRate = data.summary.visits ? Math.round((data.summary.signedInSessions / data.summary.visits) * 100) : 0;

  return <div className="analytics-console">
    <div className="analytics-toolbar"><div className="analytics-range" aria-label="Analytics range">{[7, 30, 90].map((value) => <button key={value} className={days === value ? "active" : ""} onClick={() => { if (value !== days) { setLoading(true); setDays(value); } }}>{value} days</button>)}</div><button className="analytics-refresh" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "spin" : ""} />Refresh</button></div>
    {error && <p className="analytics-warning">{error}</p>}{data.sampled && <p className="analytics-warning">This high-volume range is sampled. Shorten the date range for fully detailed activity.</p>}
    <section className="analytics-summary">
      <article><Users /><span>Visits</span><strong>{number(data.summary.visits)}</strong><small>Sessions started</small></article>
      <article><Activity /><span>Unique visitors</span><strong>{number(data.summary.uniqueVisitors)}</strong><small>Pseudonymous browsers</small></article>
      <article><Eye /><span>Page views</span><strong>{number(data.summary.pageViews)}</strong><small>{data.summary.visits ? (data.summary.pageViews / data.summary.visits).toFixed(1) : "0.0"} per visit</small></article>
      <article><ArrowRight /><span>Bounce rate</span><strong>{data.summary.bounceRate}%</strong><small>One page, &lt;10s, no action</small></article>
      <article><Clock3 /><span>Avg. time on website</span><strong>{duration(data.summary.averageEngagementMs)}</strong><small>Active, visible time per visit</small></article>
      <article><MousePointerClick /><span>Signed-in use</span><strong>{signedInRate}%</strong><small>{number(data.summary.signedInSessions)} signed-in sessions</small></article>
    </section>
    <section className="analytics-panel analytics-stay"><header><div><h2>How long people stay</h2><p>Active, visible time only—idle or background tabs are not counted.</p></div></header><div className="analytics-stay-body"><div className="analytics-stay-stats"><article><span>Median visit</span><strong>{duration(data.summary.medianEngagementMs)}</strong></article><article><span>Longest visit</span><strong>{duration(data.summary.longestEngagementMs)}</strong></article><article><span>Total active time</span><strong>{duration(data.summary.totalEngagementMs)}</strong></article></div><div className="analytics-stay-ranges">{data.stayTime.map((range) => <div key={range.label}><div><strong>{range.label}</strong><span>{range.count} visits · {range.percentage}%</span></div><i><b style={{ width: `${range.percentage}%` }} /></i></div>)}</div></div></section>
    <section className="analytics-panel analytics-trend"><header><div><h2>Traffic over time</h2><p>Daily visits, with unique visitors shown below each date.</p></div></header><div className="analytics-bars">{data.daily.map((day) => <div key={day.date} className="analytics-day" title={`${day.visits} visits · ${day.uniqueVisitors} unique · ${day.pageViews} views`}><div className="analytics-bar-value">{day.visits || ""}</div><div className="analytics-bar-track"><i style={{ height: `${Math.max(day.visits ? 8 : 2, (day.visits / maxDaily) * 100)}%` }} /></div><strong>{new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong><span>{day.uniqueVisitors} unique</span></div>)}</div></section>
    <div className="analytics-grid"><Ranking title="Acquisition" subtitle="Where visits came from" rows={data.acquisition} /><Ranking title="Locations" subtitle="Approximate city and country" rows={data.locations} /><Ranking title="Devices" subtitle="Device and browser mix" rows={data.devices} /><Ranking title="Page journeys" subtitle="Where people went next" rows={data.journeys} /></div>
    <section className="analytics-panel analytics-pages"><header><div><h2>Page performance</h2><p>Views, entry and exit points, and active engagement.</p></div></header><div className="analytics-table"><div className="analytics-table-head"><span>Page</span><span>Views</span><span>Entries</span><span>Exits</span><span>Avg. time</span></div>{data.pages.length ? data.pages.map((page) => <div key={page.path}><strong>{page.path}</strong><span>{number(page.views)}</span><span>{number(page.entries)}</span><span>{number(page.exits)}</span><span>{duration(page.averageEngagementMs)}</span></div>) : <p className="analytics-empty">No page views recorded yet.</p>}</div></section>
    <div className="analytics-grid analytics-bottom-grid"><Ranking title="Buttons and forms" subtitle="Most-used controls and submitted forms" rows={data.interactions} /><section className="analytics-panel analytics-activity"><header><div><h2>Recent activity</h2><p>Latest privacy-safe interaction events.</p></div></header><div>{data.recentActivity.length ? data.recentActivity.map((event, index) => <article key={`${event.occurredAt}-${index}`}><i className={`event-${event.eventType}`} /><div><strong>{eventLabel(event)}</strong><span>{[event.city, event.country].filter(Boolean).join(", ") || "Unknown location"} · {event.device} · {event.browser}</span></div><time>{new Date(event.occurredAt).toLocaleString()}</time></article>) : <p className="analytics-empty">No recent activity yet.</p>}</div></section></div>
  </div>;
}
