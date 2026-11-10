import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-context";
import { getDb } from "@/lib/db";
import { getMembership } from "@/lib/queries";
import { handleError } from "@/lib/api-helpers";
import { requireCsrf } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const context = await getAuthContext(request);
    const db = getDb();
    const members = db
      .prepare(
        `SELECT u.id AS userId, u.name AS name, u.email AS email, u.image AS image, m.role AS role, m.created_at AS createdAt
         FROM memberships m JOIN users u ON u.id = m.user_id
         WHERE m.workspace_id = ? ORDER BY m.created_at ASC`,
      )
      .all(context.workspaceId) as any[];
    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const blocked = requireCsrf(request);
  if (blocked) return blocked;
  try {
    const context = await getAuthContext(request);
    const membership = getMembership(context.userId, context.workspaceId);
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json({ error: { code: "forbidden", message: "Only workspace owners or admins can add members" } }, { status: 403 });
    }
    const body = (await request.json().catch(() => null)) as { email?: string; role?: string };
    const email = (body?.email ?? "").trim().toLowerCase();
    const role = body?.role === "owner" || body?.role === "admin" || body?.role === "member" || body?.role === "viewer" ? body.role : "member";
    const db = getDb();
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
    const targetUserId = user?.id;
    if (!targetUserId) {
      return NextResponse.json({ error: { code: "not_found", message: "No user found for that email" } }, { status: 404 });
    }
    const existing = db.prepare("SELECT id FROM memberships WHERE workspace_id = ? AND user_id = ?").get(context.workspaceId, targetUserId) as any;
    if (existing) {
      return NextResponse.json({ error: { code: "conflict", message: "User is already a member" } }, { status: 409 });
    }
    db.prepare("INSERT INTO memberships (id, workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)").run(`mb_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, context.workspaceId, targetUserId, role, new Date().toISOString());
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
