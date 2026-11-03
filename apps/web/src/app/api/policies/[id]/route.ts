import { NextResponse } from "next/server";
import { deletePolicy, getPolicyForWorkspace, updatePolicy } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";
import { validatePolicy, type Policy } from "@/lib/policy";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await getAuthContext(request);
    const policy = getPolicyForWorkspace(id, auth.workspaceId);
    if (!policy) {
      return NextResponse.json({ error: { code: "not_found", message: "Policy not found" } }, { status: 404 });
    }
    return NextResponse.json({ policy }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as Policy;
    const policy = validatePolicy(body);
    const ok = updatePolicy(id, auth.workspaceId, policy);
    if (!ok) {
      return NextResponse.json({ error: { code: "not_found", message: "Policy not found" } }, { status: 404 });
    }
    const updated = getPolicyForWorkspace(id, auth.workspaceId);
    return NextResponse.json({ policy: updated }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await getAuthContext(request);
    const ok = deletePolicy(id, auth.workspaceId);
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch (error) {
    return handleError(error);
  }
}
