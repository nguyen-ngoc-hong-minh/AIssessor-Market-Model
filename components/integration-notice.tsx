import { Cable, ShieldAlert } from "lucide-react";

export function IntegrationNotice({ compact = false }: { compact?: boolean }) {
  return <div className={`integration-notice ${compact ? "compact" : ""}`}><span>{compact ? <Cable /> : <ShieldAlert />}</span><div><strong>Live data services are not configured in this environment.</strong><p>Connect Convex, OpenAI, the two model-data APIs, and Stripe using the documented environment variables. BENCHFLOW fails closed instead of showing fake recommendation or payment data.</p></div></div>;
}
