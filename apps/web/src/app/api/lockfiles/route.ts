import { NextResponse } from "next/server";
import { createLockfileFromScan, listLockfiles } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";
import { validateLockfile, type Lockfile } from "@/lib/lockfile";

export async function GET(request: Request) {
  try {
    const context = await getAuthContext(request);
    const url = new URL(request.url);
    const serverId = url.searchParams.get("serverId") ?? undefined;
    const lockfiles = listLockfiles(serverId, context.workspaceId);
    return NextResponse.json({ lockfiles }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as { serverId?: string; version?: string; lock?: Lockfile };
    const serverId = body?.serverId;
    const version = body?.version ?? "v1";
    const lock = body?.lock;
    if (!serverId || !lock) {
      return NextResponse.json({ error: { code: "validation_failed", message: "serverId and lock are required" } }, { status: 400 });
    }
    const validated = validateLockfile(lock);
    const lockfileId = createLockfileFromScan(serverId, version, "", validated);
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    db.prepare("UPDATE servers SET baseline_lock_id = ? WHERE id = ?").run(lockfileId, serverId);
    return NextResponse.json({ lockfileId, lock: validated }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
