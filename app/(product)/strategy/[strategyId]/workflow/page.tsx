import type { Metadata } from "next";
import { WorkflowEditor } from "@/components/workflow-editor";

export const metadata: Metadata = { title: "Review Workflow" };

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ strategyId: string }>;
}) {
  const { strategyId } = await params;

  return (
    <div className="w-full max-w-6xl mx-auto pt-[40px] pb-10 px-[20px]">
      <WorkflowEditor strategyId={strategyId} />
    </div>
  );
}
