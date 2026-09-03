import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = { title: "How It Works" };

const steps = [
  ["01.", "Describe Objectives", "Tell Aissessor what you need in everyday language, along with budget, timing, and priorities."],
  ["02.", "Planner AI Maps Workload", "The planner engine returns a validated workflow with workload assumptions without bias toward familiar models."],
  ["03.", "Approve Workflow Steps", "Edit, reorder, add, remove, or mark steps as manual before any recommendation is calculated."],
  ["04.", "Compatibility Filtering", "Incompatible modalities, insufficient context windows, missing privacy evidence, and hard-budget failures are excluded."],
  ["05.", "Scoring & Ranking", "Priority-controlled weights evaluate benchmark performance, total cost, response speed, privacy, and evidence freshness."],
  ["06.", "Explainable AI Strategy", "Every result includes consolidated costs, evidence dates, primary source links, limitations, and alternative choices."],
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="section how-it-works-page">
        <div className="how-header-block">
          <span className="mono-badge">[ METHODOLOGY ]</span>
          <h1>Workflow First. Evidence Second. Recommendation Last.</h1>
          <p className="lead-text">
            Aissessor separates understanding your workload from choosing the technology. This guarantees unbiased, verifiable recommendations tailored to your exact budget and requirements.
          </p>
        </div>

        <div className="how-process-grid">
          {steps.map(([num, title, desc]) => (
            <article className="how-card" key={num}>
              <header>
                <span className="card-num-lbl">{num}</span>
                <ArrowUpRight className="w-4 h-4 text-black" />
              </header>
              <h2>{title}</h2>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
