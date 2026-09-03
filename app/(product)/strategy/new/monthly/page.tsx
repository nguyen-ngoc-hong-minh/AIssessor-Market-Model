import type { Metadata } from "next";
import { TrialExperience } from "@/components/trial-experience";

export const metadata: Metadata = { title: "New Monthly Strategy" };

export default function NewMonthlyStrategyPage() {
  return <TrialExperience signedInMode="monthly" />;
}
