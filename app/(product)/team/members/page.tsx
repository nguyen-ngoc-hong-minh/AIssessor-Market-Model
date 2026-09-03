import type { Metadata } from "next";
import { TeamView } from "@/components/team-view";
export const metadata:Metadata={title:"Team members"};
export default function MembersPage(){return <div className="page-wrap"><div className="page-title"><div><span className="kicker">Team members</span><h1>Membership and roles</h1><p>Team owners and members are stored in Convex and protected by membership checks.</p></div></div><TeamView/></div>}
