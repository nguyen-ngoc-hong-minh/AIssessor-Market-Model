import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  redirect("/home");
}
