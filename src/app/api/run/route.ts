import { NextRequest, NextResponse } from "next/server";
import { executeWorkflow } from "@/lib/engine";
import { saveRun, getWorkflow } from "@/lib/server/store";
import type { FlowNode, FlowEdge } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Execute a workflow on the server. Accepts either an inline graph
 * (nodes+edges) or a stored workflow id. Returns the full RunRecord.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  let nodes: FlowNode[] = body.nodes;
  let edges: FlowEdge[] = body.edges;
  let workflowId = body.workflowId || "inline";
  let workflowName = body.workflowName || "Inline workflow";

  if ((!nodes || !edges) && body.workflowId) {
    const wf = await getWorkflow(body.workflowId);
    if (!wf) return NextResponse.json({ error: "workflow not found" }, { status: 404 });
    nodes = wf.nodes;
    edges = wf.edges;
    workflowId = wf.id;
    workflowName = wf.name;
  }

  if (!nodes) {
    return NextResponse.json({ error: "nodes are required" }, { status: 400 });
  }

  const record = await executeWorkflow(
    nodes,
    edges || [],
    { workflowId, workflowName },
    {
      trigger: body.trigger || "api",
      initialInput: body.input,
      startNodeId: body.startNodeId,
    }
  );

  if (workflowId !== "inline") {
    await saveRun(record).catch(() => {});
  }

  return NextResponse.json({ run: record });
}
