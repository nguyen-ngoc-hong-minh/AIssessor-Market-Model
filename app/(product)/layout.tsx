import { AppShell } from "@/components/app-shell";
import { IntegrationNotice } from "@/components/integration-notice";
import { integrationsConfigured } from "@/components/providers";
import { authenticatedConvex } from "@/lib/server/convex";
import { anyApi } from "convex/server";

export const dynamic = "force-dynamic";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  if (!integrationsConfigured) return <div className="page-wrap"><IntegrationNotice /></div>;
  const client = await authenticatedConvex();
  const current = await client.query(anyApi.users.current, {}) as { user: { name?: string; email: string; onboardingComplete: boolean } };
  return <AppShell user={{ name: current.user.name ?? current.user.email, email: current.user.email }}>{children}</AppShell>;
}
