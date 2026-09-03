import type { Metadata } from "next";
import { AnalyticsAdmin } from "@/components/analytics-admin";

export const metadata: Metadata = { title: "Website analytics" };

export default function AnalyticsAdminPage() {
  return <div className="page-wrap analytics-page"><div className="page-title"><div><span className="kicker">Admin console</span><h1>Website analytics.</h1><p>Visitors, journeys, engagement, acquisition, locations, and interactions—without storing raw IP addresses or form contents.</p></div></div><AnalyticsAdmin /></div>;
}
