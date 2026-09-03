import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard-view";
export const metadata:Metadata={title:"Team strategies"};
export default function TeamStrategiesPage(){return <div className="page-wrap"><div className="page-title"><div><span className="kicker">Team strategies</span><h1>Shared saved strategies</h1><p>Only strategies accessible through verified team membership can appear here.</p></div></div><DashboardView/></div>}
