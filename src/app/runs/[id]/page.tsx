import { RunDetail } from "@/components/runs/RunDetail";

export const metadata = {
  title: "Run Detail — FlowForge",
  description: "Inspect per-node input, output, timing, and logs for a run.",
};

export default function RunDetailPage({ params }: { params: { id: string } }) {
  return <RunDetail runId={params.id} />;
}
