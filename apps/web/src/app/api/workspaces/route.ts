import { NextResponse } from "next/server";
import { createWorkspace, getMembership, listWorkspacesForUser } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { workspaceSchema } from "@/lib/validations";
import { handleError } from "@/lib/api-helpers";
import { requireCsrf } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const context = await getAuthContext(request, { allowNoWorkspace: true });
    const workspaces = listWorkspacesForUser(context.userId);
    const memberships = (await import("@/lib/db")).getDb().prepare("SELECT workspace_id AS workspaceId, role FROM memberships WHERE user_id = ?").all(context.userId) as any[];
    return NextResponse.json({ workspaces, memberships }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const blocked = requireCsrf(request);
  if (blocked) return blocked;
  try {
    const context = await getAuthContext(request, { allowNoWorkspace: true });
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = workspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "validation_failed", message: parsed.error.issues[0]?.message ?? "Invalid workspace payload" } }, { status: 400 });
    }
    const workspace = createWorkspace(context.userId, parsed.data.name);
    const membership = getMembership(context.userId, workspace.id);
    return NextResponse.json({ workspace, membership }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
