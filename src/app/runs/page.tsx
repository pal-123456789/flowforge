import { RunHistory } from "@/components/runs/RunHistory";

export const metadata = {
  title: "Run History — FlowForge",
  description: "Browse and inspect every workflow execution.",
};

export default function RunsPage() {
  return <RunHistory />;
}
