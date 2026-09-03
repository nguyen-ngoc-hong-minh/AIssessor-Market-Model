import type { Metadata } from "next";
import { EvidenceAdmin } from "@/components/evidence-admin";

export const metadata: Metadata = { title: "Evidence diagnostics" };

export default function EvidenceAdminPage() {
  return <div className="page-wrap"><div className="page-title"><div><span className="kicker">System diagnostics</span><h1>Recommendation evidence.</h1><p>Source health, freshness, ingestion history, and model eligibility.</p></div></div><EvidenceAdmin /></div>;
}
