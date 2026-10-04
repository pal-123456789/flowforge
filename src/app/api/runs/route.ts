import { NextRequest, NextResponse } from "next/server";
import { listRuns } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const workflowId = req.nextUrl.searchParams.get("workflowId") || undefined;
  const runs = await listRuns(workflowId);
  return NextResponse.json({ runs });
}
