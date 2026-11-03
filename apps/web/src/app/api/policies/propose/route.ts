import { NextResponse } from "next/server";
import { createPolicy } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";
import { proposePolicy } from "@/lib/policy";

export async function POST(request: Request) {
  try {
    const context = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as { lockfileId?: string };
    const lockfileId = body?.lockfileId;
    if (!lockfileId) {
      return NextResponse.json({ error: { code: "validation_failed", message: "lockfileId is required" } }, { status: 400 });
    }
    const lock = (await import("@/lib/queries")).getLockfileForWorkspace(lockfileId, context.workspaceId);
    if (!lock) {
      return NextResponse.json({ error: { code: "not_found", message: "Behavioral lockfile not found" } }, { status: 404 });
    }
    const policy = proposePolicy(lock.data);
    const created = createPolicy(context.workspaceId, policy);
    return NextResponse.json({ policy: created }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
