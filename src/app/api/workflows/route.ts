import { NextRequest, NextResponse } from "next/server";
import { listWorkflows, saveWorkflow } from "@/lib/server/store";
import type { Workflow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const wfs = await listWorkflows();
  return NextResponse.json({ workflows: wfs });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Workflow;
  if (!body?.id || !body?.name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }
  const saved = await saveWorkflow(body);
  return NextResponse.json({ workflow: saved });
}
