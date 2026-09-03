import type { Metadata } from "next";
import { TrialExperience } from "@/components/trial-experience";

export const metadata: Metadata = { title: "New Strategy" };

export default function OneOffPage() {
  return <TrialExperience signedInMode="one_off" />;
}
