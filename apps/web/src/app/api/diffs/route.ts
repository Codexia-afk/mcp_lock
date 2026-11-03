import { NextResponse } from "next/server";
import { createDiff } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const context = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as { baselineLockId?: string; candidateLockId?: string; autoApproveNarrower?: boolean };
    const baselineLockId = body?.baselineLockId;
    const candidateLockId = body?.candidateLockId;
    if (!baselineLockId || !candidateLockId) {
      return NextResponse.json({ error: { code: "validation_failed", message: "baselineLockId and candidateLockId are required" } }, { status: 400 });
    }
    const { report, id } = createDiff(baselineLockId, candidateLockId, Boolean(body?.autoApproveNarrower));
    return NextResponse.json({ diff: report, id }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
