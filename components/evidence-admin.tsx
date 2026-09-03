"use client";

import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Run = { _id: string; status: string; startedAt: number; completedAt?: number; createdCount: number; updatedCount: number; recordsImported?: number; unchanged?: boolean; error?: string };
type Source = { id: string; name: string; kind: string; sourceUrl: string; refreshHours: number; attribution: string; requiredEnvironment?: string; supported: boolean; unsupportedReason?: string; latestRun: Run | null; latestSnapshot: { fetchedAt: number; sourceVersion?: string } | null };
type Diagnostics = { planner: { name: string; configured: boolean; provider: string; model: string | null; lastSuccessfulAnalysis: number | null; lastError: { at: number; code: string; message: string } | null }; sources: Source[]; manualReviewModels: Array<{ id: string; canonicalId: string; name: string; provider: string; aliases: string[]; updatedAt: number }>; counts: { total: number; eligible: number; pending: number; manualReview: number; providers: number; withVerifiedAccess: number; recommendableNow: number }; capabilityCounts: { textAndReasoning: number; codingAndAgents: number; researchAndDocuments: number; image: number; video: number; audioAndSpeech: number; designAndPresentations: number }; aiFirstCounts: { native: number; centric: number; assisted: number; traditional: number; unclassified: number } };

function relativeDate(value: number | undefined, now: number) {
  if (!value) return "Never";
  const hours = Math.round((now - value) / 3_600_000);
  return hours < 1 ? "Less than an hour ago" : hours < 48 ? `${hours} hours ago` : `${Math.round(hours / 24)} days ago`;
}

export function EvidenceAdmin() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const load = useCallback(() => fetch("/api/admin/evidence").then(async (response) => {
    const body = await response.json() as Diagnostics | { error?: string };
    if (!response.ok) throw new Error("error" in body ? body.error ?? "Diagnostics unavailable" : "Diagnostics unavailable");
    setData(body as Diagnostics); setError("");
  }).catch((reason) => setError(reason instanceof Error ? reason.message : "Diagnostics unavailable")), []);
  useEffect(() => { void load(); }, [load]);
  async function sync(source: string) {
    setSyncing(source); setError("");
    try {
      const response = await fetch("/api/admin/evidence", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ source }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Sync failed");
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Sync failed"); }
    finally { setSyncing(null); }
  }
  if (!data) return <div className="evidence-loading">{error || "Loading evidence diagnostics..."}</div>;
  return <div className="evidence-console">
    <section className="planner-diagnostic"><header><div><span>Workflow service</span><h2>{data.planner.name}</h2></div><strong className={data.planner.configured ? "configured" : "not-configured"}>{data.planner.configured ? "Configured: Yes" : "Configured: No"}</strong></header><div><span>Provider<strong>{data.planner.provider}</strong></span><span>Model<strong>{data.planner.model ?? "Not configured"}</strong></span><span>Last successful task analysis<strong>{data.planner.lastSuccessfulAnalysis ? relativeDate(data.planner.lastSuccessfulAnalysis, now) : "Never"}</strong></span><span>Last error<strong>{data.planner.lastError ? `${data.planner.lastError.code}: ${data.planner.lastError.message}` : "None recorded"}</strong></span></div></section>
    <section className="evidence-counts" aria-label="Model evidence counts"><div><span>Recommendable now</span><strong>{data.counts.recommendableNow}</strong></div><div><span>Verified access</span><strong>{data.counts.withVerifiedAccess}</strong></div><div><span>Eligible evidence</span><strong>{data.counts.eligible}</strong></div><div><span>Providers</span><strong>{data.counts.providers}</strong></div><div><span>Pending evidence</span><strong>{data.counts.pending}</strong></div><div><span>Manual review</span><strong>{data.counts.manualReview}</strong></div><div><span>Total identities</span><strong>{data.counts.total}</strong></div></section>
    <section className="evidence-counts capability-counts" aria-label="Recommendable model capability coverage"><div><span>Text & reasoning</span><strong>{data.capabilityCounts.textAndReasoning}</strong></div><div><span>Coding & agents</span><strong>{data.capabilityCounts.codingAndAgents}</strong></div><div><span>Research & documents</span><strong>{data.capabilityCounts.researchAndDocuments}</strong></div><div><span>Image</span><strong>{data.capabilityCounts.image}</strong></div><div><span>Video</span><strong>{data.capabilityCounts.video}</strong></div><div><span>Audio & speech</span><strong>{data.capabilityCounts.audioAndSpeech}</strong></div><div><span>Design & presentations</span><strong>{data.capabilityCounts.designAndPresentations}</strong></div></section>
    <section className="evidence-counts ai-first-counts" aria-label="AI-first product classifications"><div><span>AI native</span><strong>{data.aiFirstCounts.native}</strong></div><div><span>AI centric</span><strong>{data.aiFirstCounts.centric}</strong></div><div><span>AI assisted</span><strong>{data.aiFirstCounts.assisted}</strong></div><div><span>Traditional</span><strong>{data.aiFirstCounts.traditional}</strong></div><div><span>Unclassified</span><strong>{data.aiFirstCounts.unclassified}</strong></div></section>
    {error && <p className="error-message"><AlertTriangle />{error}</p>}
    <section className="evidence-source-table"><header><span>Source</span><span>Status</span><span>Latest snapshot</span><span>Last run</span><span /></header>{data.sources.map((source) => {
      const stale = source.latestSnapshot ? now - source.latestSnapshot.fetchedAt > source.refreshHours * 3_600_000 * 2 : true;
      const status = !source.supported ? "Unsupported" : source.latestRun?.status === "failed" ? "Failed" : !source.latestSnapshot ? "Not synced" : stale ? "Stale" : "Current";
      return <article key={source.id}><div><strong>{source.name}</strong><small>{source.kind.replace("_", " ")} · every {source.refreshHours}h</small><a href={source.sourceUrl} target="_blank" rel="noreferrer">Official source <ExternalLink /></a></div><div className={`source-status ${status.toLowerCase().replace(" ", "-")}`}>{status === "Current" ? <CheckCircle2 /> : <AlertTriangle />}<span>{status}</span></div><div><strong>{relativeDate(source.latestSnapshot?.fetchedAt, now)}</strong><small>{source.latestSnapshot?.sourceVersion ?? "No source version reported"}</small></div><div><strong>{source.latestRun ? relativeDate(source.latestRun.completedAt ?? source.latestRun.startedAt, now) : "Never"}</strong><small>{source.latestRun?.error ?? (source.latestRun?.unchanged ? "No source changes" : source.latestRun ? `${source.latestRun.recordsImported ?? 0} observations imported` : source.unsupportedReason ?? "Awaiting first run")}</small></div><button className="icon-button" aria-label={`Sync ${source.name}`} title={`Sync ${source.name}`} disabled={!source.supported || syncing !== null} onClick={() => void sync(source.id)}><RefreshCw className={syncing === source.id ? "spin" : ""} /></button></article>;
    })}</section>
    {data.manualReviewModels.length > 0 && <section className="manual-review-list"><header><div><h2>Identity review queue</h2><p>These source records are preserved but cannot qualify for recommendations until an explicit canonical alias is added.</p></div><span>{data.manualReviewModels.length}</span></header>{data.manualReviewModels.map((model) => <div key={model.id}><div><strong>{model.name}</strong><small>{model.provider}</small></div><code>{model.canonicalId}</code><small>{model.aliases.join(", ")}</small></div>)}</section>}
  </div>;
}
