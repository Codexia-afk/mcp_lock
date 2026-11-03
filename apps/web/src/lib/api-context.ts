import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getMembership } from "@/lib/queries";
import { ApiError } from "@/lib/errors";

export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: string;
}

export async function getAuthContext(request: Request, options?: { workspaceId?: string; allowNoWorkspace?: boolean }): Promise<AuthContext> {
  const session = await getSessionUser({ headers: request.headers });
  if (!session) {
    throw new ApiError(401, "unauthorized", "Authentication required");
  }
  const url = new URL(request.url);
  const workspaceIdParam = options?.workspaceId ?? url.searchParams.get("workspaceId");
  const db = getDb();
  const membershipRow = db
    .prepare("SELECT workspace_id AS workspaceId, user_id AS userId, role FROM memberships WHERE user_id = ? AND workspace_id = ?")
    .get(session.userId, workspaceIdParam ?? "") as any;
  let workspaceId = workspaceIdParam ?? "";
  if (!membershipRow && !workspaceIdParam) {
    const first = db.prepare("SELECT workspace_id AS workspaceId FROM memberships WHERE user_id = ? ORDER BY created_at ASC LIMIT 1").get(session.userId) as any;
    workspaceId = first?.workspaceId ?? "";
  }
  const membership = membershipRow ? (membershipRow as any) : getMembership(session.userId, workspaceId);
  if (!membership) {
    if (options?.allowNoWorkspace) {
      return { userId: session.userId, workspaceId: "", role: "user" };
    }
    throw new ApiError(403, "forbidden", "Workspace access denied");
  }
  return { userId: session.userId, workspaceId, role: membership.role };
}
