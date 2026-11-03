import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";
import { requireCsrf } from "@/lib/api-utils";
import { ingestScan } from "@/lib/queries";
import { computeEvidenceDigest, validateLockfile, type Lockfile, type Observation } from "@/lib/lockfile";
import { ApiError } from "@/lib/errors";

const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;

export async function GET(request: Request) {
  try {
    const context = await getAuthContext(request);
    const url = new URL(request.url);
    const serverId = url.searchParams.get("serverId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const limitParam = Number(url.searchParams.get("limit") ?? 50);
    const offsetParam = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(100, limitParam) : 50;
    const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : 0;
    const db = getDb();
    const rows = serverId
      ? (db.prepare("SELECT * FROM scans WHERE server_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?").all(serverId, limit, offset) as any[])
      : (db.prepare("SELECT * FROM scans ORDER BY started_at DESC LIMIT ? OFFSET ?").all(limit, offset) as any[]);
    const scans = rows.map((r) => ({ id: r.id, serverId: r.server_id, status: r.status, backend: r.backend, startedAt: r.started_at, completedAt: r.completed_at ?? undefined, scenarioSuite: r.scenario_suite ?? undefined, fixtureDigest: r.fixture_digest ?? undefined, evidenceDigest: r.evidence_digest, complete: !!r.complete, protocolVersion: r.protocol_version ?? undefined, observerBackend: r.observer_backend ?? undefined, observerLostEvents: r.observer_lost_events ?? undefined, events: JSON.parse((r.events as string) ?? "[]") }));
    return NextResponse.json({ scans, limit, offset }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const blocked = requireCsrf(request);
  if (blocked) return blocked;
  try {
    const context = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as { serverId?: string; version?: string; lock?: Lockfile; events?: Observation[]; status?: "completed" | "incomplete" | "failed"; backend?: string };
    const serverId = body?.serverId;
    if (!serverId) {
      return NextResponse.json({ error: { code: "validation_failed", message: "serverId is required" } }, { status: 400 });
    }
    const db = getDb();
    const server = db.prepare("SELECT * FROM servers WHERE id = ? AND workspace_id = ?").get(serverId, context.workspaceId) as any;
    if (!server) {
      throw new ApiError(404, "not_found", "MCP server not found");
    }
    const status = body?.status ?? "completed";
    const backend = body?.backend ?? "docker-strace-linux-v1";
    let lock: Lockfile;
    let events: Observation[];
    if (body?.lock) {
      lock = validateLockfile(body.lock);
      events = lock.observations;
    } else {
      const imageDigest = server.image_digest ?? ZERO_DIGEST;
      const suiteDigest = ZERO_DIGEST;
      lock = {
        schemaVersion: "1",
        server: { imageDigest, entrypoint: ["/app/server"] },
        protocol: { version: "2026-07-28", transport: "stdio" },
        scenarioSuite: { digest: suiteDigest, fixtureDigest: suiteDigest, completed: 0, total: Math.max(1, (body?.events ?? []).length) },
        environment: { imageDigest, kernel: "linux", arch: "amd64" },
        observer: { backend, version: "0.1.0", lostEvents: 0, status: status === "completed" ? "complete" : "incomplete" },
        observations: body?.events ?? [],
        evidenceDigest: computeEvidenceDigest(imageDigest, suiteDigest, body?.events ?? []),
      };
      const valid = (() => {
        try {
          validateLockfile(lock);
          return true;
        } catch {
          return false;
        }
      })();
      if (!valid) {
        return NextResponse.json({ error: { code: "invalid_behavior_lock", message: "Uploaded behavior.lock did not pass schema validation" } }, { status: 422 });
      }
    }
    const scan = ingestScan(serverId, lock.server.imageDigest, lock.observer.status === "complete" ? "completed" : "incomplete", lock.observer.backend, lock.observations);
    return NextResponse.json({ scan, lockfile: lock }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
