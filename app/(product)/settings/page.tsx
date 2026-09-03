import type { Metadata } from "next";
import { anyApi } from "convex/server";
import { SettingsView } from "@/components/settings-view";
import { authenticatedConvex } from "@/lib/server/convex";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const client = await authenticatedConvex();
  const current = (await client.query(anyApi.users.current, {})) as {
    user: { accountType?: "individual" | "team" | "enterprise"; preferredLanguage: string };
    profile: {
      profession?: string;
      industry?: string;
      teamSize?: string;
      companySize?: string;
      departments?: string[];
      country?: string;
      preferredLanguage?: string;
    } | null;
  };

  const profile = {
    accountType: current.user.accountType,
    preferredLanguage: current.profile?.preferredLanguage ?? current.user.preferredLanguage,
    ...current.profile,
  };

  return (
    <div className="editorial-page-container max-w-4xl">
      <SettingsView profile={profile} />
    </div>
  );
}
