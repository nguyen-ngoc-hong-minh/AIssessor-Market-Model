import type { Metadata } from "next";
import { ResultsView } from "@/components/results-view";

export const metadata: Metadata = { title: "Strategy Results" };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ strategyId: string }>;
}) {
  const { strategyId } = await params;
  return (
    <div className="saved-result-route w-full">
      <ResultsView strategyId={strategyId} />
    </div>
  );
}
