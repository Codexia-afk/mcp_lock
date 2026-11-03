import { getDb } from "@/lib/db";
import { logAudit } from "@/lib/auth";
import { compareLocks, computeEvidenceDigest, makeDiffReport, validateLockfile, type DiffResult, type Lockfile, type Observation } from "@/lib/lockfile";
import { assessCandidate, type Assessment, type Policy } from "@/lib/policy";
import type { AuditEvent, McpServer, Membership, Scan, Workspace } from "@/lib/types";

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;

export function createUser(name: string, email: string, passwordHash?: string) {
  const db = getDb();
  const id = uid("usr");
  db.prepare("INSERT INTO users (id, name, email, email_verified, image, password_hash, created_at, updated_at) VALUES (?, ?, ?, 0, NULL, ?, ?, ?)").run(id, name, email, passwordHash ?? null, nowIso(), nowIso());
  createWorkspace(id, `${name}'s Workspace`);
  return { id, name, email };
}

export function listWorkspacesForUser(userId: string): Workspace[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT w.id, w.name, w.slug, w.owner_id AS ownerId, w.created_at AS createdAt, w.updated_at AS updatedAt
       FROM workspaces w
       JOIN memberships m ON m.workspace_id = w.id
       WHERE m.user_id = ?`,
    )
    .all(userId) as any[];
  return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, ownerId: r.ownerId, createdAt: r.createdAt, updatedAt: r.updatedAt }));
}

export function createWorkspace(userId: string, name: string): Workspace {
  const db = getDb();
  const id = uid("ws");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "workspace";
  db.prepare("INSERT INTO workspaces (id, name, slug, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, name, slug, userId, nowIso(), nowIso());
  db.prepare("INSERT INTO memberships (id, workspace_id, user_id, role, created_at) VALUES (?, ?, ?, 'owner', ?)").run(uid("mb"), id, userId, nowIso());
  logAudit({ workspaceId: id, userId, action: "workspace.created", targetType: "workspace", targetId: id, metadata: { name } });
  return { id, name, slug, ownerId: userId, createdAt: nowIso(), updatedAt: nowIso() };
}

export function getMembership(userId: string, workspaceId: string): Membership | null {
  const db = getDb();
  const row = db.prepare("SELECT id, workspace_id AS workspaceId, user_id AS userId, role, created_at AS createdAt FROM memberships WHERE user_id = ? AND workspace_id = ?").get(userId, workspaceId) as any;
  if (!row) return null;
  return { id: row.id, workspaceId: row.workspaceId, userId: row.userId, role: row.role as Membership["role"], createdAt: row.createdAt };
}

export function listProjects(workspaceId: string) {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM projects WHERE workspace_id = ? ORDER BY created_at ASC").all(workspaceId) as any[];
  return rows.map((r) => ({ id: r.id, workspaceId: r.workspace_id, name: r.name, description: r.description, createdAt: r.created_at, updatedAt: r.updated_at }));
}

export function createProject(workspaceId: string, name: string, description?: string) {
  const db = getDb();
  const id = uid("pr");
  db.prepare("INSERT INTO projects (id, workspace_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, workspaceId, name, description ?? null, nowIso(), nowIso());
  logAudit({ workspaceId, action: "project.created", targetType: "project", targetId: id, metadata: { name } });
  return { id, workspaceId, name, description, createdAt: nowIso(), updatedAt: nowIso() };
}

export function deleteProject(projectId: string): boolean {
  const db = getDb();
  const serverIds = (db.prepare("SELECT id FROM servers WHERE project_id = ?").all(projectId) as any[]).map((s) => s.id);
  const deleteWhere = (table: string, where: string, params: unknown[]) => {
    db.prepare(`DELETE FROM ${table} WHERE ${where}`).run(...(params as []));
  };
  const scansToDelete = serverIds.length
    ? (db.prepare(`SELECT id FROM scans WHERE server_id IN (${serverIds.map(() => "?").join(",")})`).all(...serverIds) as any[]).map((s) => s.id)
    : [];
  const lockfilesToDelete = scansToDelete.length
    ? (db.prepare(`SELECT id FROM lockfiles WHERE scan_id IN (${scansToDelete.map(() => "?").join(",")})`).all(...scansToDelete) as any[]).map((l) => l.id)
    : [];
  const diffsToDelete = lockfilesToDelete.length
    ? (db.prepare(`SELECT id FROM diffs WHERE baseline_lock_id IN (${lockfilesToDelete.map(() => "?").join(",")}) OR candidate_lock_id IN (${lockfilesToDelete.map(() => "?").join(",")})`).all(...lockfilesToDelete, ...lockfilesToDelete) as any[]).map((d) => d.id)
    : [];
  for (const s of scansToDelete) deleteWhere("scans", "server_id = ?", [s]);
  for (const l of lockfilesToDelete) deleteWhere("lockfiles", "id = ?", [l]);
  for (const d of diffsToDelete) deleteWhere("diffs", "id = ?", [d]);
  for (const s of serverIds) deleteWhere("servers", "id = ?", [s]);
  deleteWhere("projects", "id = ?", [projectId]);
  return true;
}

export function listServers(workspaceId: string, projectId?: string): McpServer[] {
  const db = getDb();
  const rows = projectId
    ? (db.prepare("SELECT * FROM servers WHERE workspace_id = ? AND project_id = ? ORDER BY registered_at DESC").all(workspaceId, projectId) as any[])
    : (db.prepare("SELECT * FROM servers WHERE workspace_id = ? ORDER BY registered_at DESC").all(workspaceId) as any[]);
  const lastScan = new Map<string, string>();
  if (rows.length) {
    const serverIds = rows.map((r) => r.id);
    const scanRows = db.prepare(`SELECT server_id AS serverId, started_at AS startedAt, id AS scanId FROM scans WHERE server_id IN (${serverIds.map(() => "?").join(",")}) ORDER BY started_at DESC`).all(...serverIds) as any[];
    for (const s of scanRows) lastScan.set(s.serverId, s.scanId);
  }
  const projectRows = db.prepare("SELECT id AS id, name AS name FROM projects WHERE workspace_id = ?").all(workspaceId) as any[];
  const projectName = new Map(projectRows.map((p) => [p.id, p.name]));
  return rows.map((r) => ({ id: r.id, workspaceId: r.workspace_id, projectId: r.project_id, name: r.name, packageName: r.package_name ?? undefined, version: r.version ?? undefined, source: r.source ?? undefined, imageDigest: r.image_digest ?? undefined, registeredAt: r.registered_at, lastScannedAt: lastScan.get(r.id), baselineLockId: undefined })) as McpServer[];
}

export function deleteServer(id: string, workspaceId: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM servers WHERE id = ? AND workspace_id = ?").run(id, workspaceId);
  return (result.changes ?? 0) > 0;
}

export function createServer(workspaceId: string, projectId: string, input: { name: string; packageName?: string; version?: string; source?: string; imageDigest?: string }): McpServer {
  const db = getDb();
  const id = uid("srv");
  db.prepare("INSERT INTO servers (id, workspace_id, project_id, name, package_name, version, source, image_digest, registered_at, last_scanned_at, baseline_lock_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)").run(id, workspaceId, projectId, input.name, input.packageName ?? null, input.version ?? null, input.source ?? null, input.imageDigest ?? null, nowIso());
  logAudit({ workspaceId, action: "server.registered", targetType: "server", targetId: id, metadata: { name: input.name } });
  return { id, workspaceId, projectId, name: input.name, packageName: input.packageName, version: input.version, source: input.source, imageDigest: input.imageDigest, registeredAt: nowIso(), lastScannedAt: undefined, baselineLockId: undefined };
}

export function listScans(serverId?: string, limit = 50, offset = 0) {
  const db = getDb();
  const rows = serverId
    ? (db.prepare("SELECT * FROM scans WHERE server_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?").all(serverId, limit, offset) as any[])
    : (db.prepare("SELECT * FROM scans ORDER BY started_at DESC LIMIT ? OFFSET ?").all(limit, offset) as any[]);
  return rows.map((r) => ({ id: r.id, serverId: r.server_id, status: r.status, backend: r.backend, startedAt: r.started_at, completedAt: r.completed_at ?? undefined, scenarioSuite: r.scenario_suite ?? undefined, fixtureDigest: r.fixture_digest ?? undefined, evidenceDigest: r.evidence_digest, complete: !!r.complete, protocolVersion: r.protocol_version ?? undefined, observerBackend: r.observer_backend ?? undefined, observerLostEvents: r.observer_lost_events ?? undefined, events: JSON.parse((r.events as string) ?? "[]") })) as Scan[];
}

export function getScan(id: string): Scan | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM scans WHERE id = ?").get(id) as any;
  if (!row) return null;
  return { id: row.id, serverId: row.server_id, status: row.status, backend: row.backend, startedAt: row.started_at, completedAt: row.completed_at ?? undefined, scenarioSuite: row.scenario_suite ?? undefined, fixtureDigest: row.fixture_digest ?? undefined, evidenceDigest: row.evidence_digest, complete: !!row.complete, protocolVersion: row.protocol_version ?? undefined, observerBackend: row.observer_backend ?? undefined, observerLostEvents: row.observer_lost_events ?? undefined, events: JSON.parse((row.events as string) ?? "[]") };
}

export function ingestScan(serverId: string, serverImageDigest: string, status: "completed" | "incomplete" | "failed", backend: string, events: Observation[]): Scan {
  const db = getDb();
  const suiteDigest = ZERO_DIGEST;
  const complete = status === "completed";
  const lock: Lockfile = {
    schemaVersion: "1",
    server: { imageDigest: serverImageDigest, entrypoint: ["/app/server"] },
    protocol: { version: "2026-07-28", transport: "stdio" },
    scenarioSuite: { digest: suiteDigest, fixtureDigest: suiteDigest, completed: complete ? Math.max(1, events.length) : 0, total: Math.max(1, events.length) },
    environment: { imageDigest: serverImageDigest, kernel: "linux", arch: "amd64" },
    observer: { backend, version: "0.1.0", lostEvents: complete ? 0 : 1, status: complete ? "complete" : "incomplete" },
    observations: events,
    evidenceDigest: computeEvidenceDigest(serverImageDigest, suiteDigest, events),
  };
  validateLockfile(lock);
  const id = uid("scan");
  db.prepare("INSERT INTO scans (id, server_id, status, backend, started_at, completed_at, scenario_suite, fixture_digest, evidence_digest, complete, protocol_version, observer_backend, observer_lost_events, events, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, serverId, status, backend, nowIso(), complete ? nowIso() : null, JSON.stringify(lock.scenarioSuite), lock.environment.imageDigest, lock.evidenceDigest, complete ? 1 : 0, lock.protocol.version, backend, complete ? 0 : 1, JSON.stringify(events), nowIso());
  logAudit({ action: "scan.ingested", targetType: "scan", targetId: id, metadata: { serverId, status, events: events.length } });
  const scan: Scan = { id, serverId, status, backend, startedAt: nowIso(), completedAt: complete ? nowIso() : undefined, evidenceDigest: lock.evidenceDigest, complete, events };
  return scan;
}

export function listLockfiles(serverId?: string, workspaceId?: string) {
  const db = getDb();
  const rows = serverId
    ? (db.prepare("SELECT * FROM lockfiles WHERE server_id = ? ORDER BY created_at DESC").all(serverId) as any[])
    : workspaceId
      ? (db.prepare("SELECT l.* FROM lockfiles l JOIN servers s ON s.id = l.server_id WHERE s.workspace_id = ? ORDER BY l.created_at DESC").all(workspaceId) as any[])
      : (db.prepare("SELECT * FROM lockfiles ORDER BY created_at DESC").all() as any[]);
  return rows.map((r) => ({ id: r.id, serverId: r.server_id, scanId: r.scan_id, version: r.version, data: JSON.parse(r.data as string) as Lockfile, evidenceDigest: r.evidence_digest, createdAt: r.created_at }));
}

export function getLockfileForWorkspace(id: string, workspaceId: string) {
  const db = getDb();
  const row = db.prepare(`SELECT l.id AS id, l.server_id AS serverId, l.scan_id AS scanId, l.version AS version, l.data AS data, l.evidence_digest AS evidenceDigest, l.created_at AS createdAt, s.workspace_id AS workspaceId FROM lockfiles l JOIN servers s ON s.id = l.server_id WHERE l.id = ? AND s.workspace_id = ?`).get(id, workspaceId) as any;
  if (!row) return null;
  const data = JSON.parse(row.data as string) as Lockfile;
  return { id: row.id, serverId: row.serverId, scanId: row.scanId, version: row.version, data, evidenceDigest: row.evidenceDigest, createdAt: row.createdAt, workspaceId: row.workspaceId };
}

export function createLockfileFromScan(serverId: string, version: string, scanId: string, data: Lockfile): string {
  const db = getDb();
  const id = uid("lock");
  db.prepare("INSERT INTO lockfiles (id, server_id, scan_id, version, data, evidence_digest, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, serverId, scanId, version, JSON.stringify(data), data.evidenceDigest, nowIso());
  return id;
}

export function createDiff(baselineLockId: string, candidateLockId: string, autoApproveNarrower: boolean): { diff: DiffResult; report: ReturnType<typeof makeDiffReport>; id: string } {
  const db = getDb();
  const baselineRow = db.prepare("SELECT data FROM lockfiles WHERE id = ?").get(baselineLockId) as { data: string } | undefined;
  const candidateRow = db.prepare("SELECT data FROM lockfiles WHERE id = ?").get(candidateLockId) as { data: string } | undefined;
  const baseline = JSON.parse(baselineRow?.data ?? "null") as Lockfile;
  const candidate = JSON.parse(candidateRow?.data ?? "null") as Lockfile;
  const diff = compareLocks(baseline, candidate);
  const identityChanged = baseline.server.imageDigest !== candidate.server.imageDigest;
  const report = makeDiffReport(diff, autoApproveNarrower, identityChanged);
  const id = uid("diff");
  db.prepare("INSERT INTO diffs (id, baseline_lock_id, candidate_lock_id, added, removed, status, identity_changed, auto_approve_narrower, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, baselineLockId, candidateLockId, JSON.stringify(report.added), JSON.stringify(report.removed), report.status, identityChanged ? 1 : 0, autoApproveNarrower ? 1 : 0, nowIso());
  return { diff, report, id };
}

export function listPolicies(workspaceId: string): Policy[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM policies WHERE workspace_id = ? ORDER BY updated_at DESC").all(workspaceId) as any[];
  return rows.map((r) => ({
    schemaVersion: "1",
    status: r.status,
    serverImageDigest: r.server_image_digest,
    evidenceDigest: r.evidence_digest,
    files: JSON.parse(r.files ?? "[]"),
    network: JSON.parse(r.network ?? "[]"),
    executables: JSON.parse(r.executables ?? "[]"),
    requiredControls: JSON.parse(r.required_controls ?? "[]"),
    reviewRequired: JSON.parse(r.review_required ?? "[]"),
    approvedBy: r.approved_by ?? undefined,
  }));
}

export function getPolicyForWorkspace(id: string, workspaceId: string): Policy | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM policies WHERE id = ? AND workspace_id = ?").get(id, workspaceId) as any;
  if (!row) return null;
  return {
    schemaVersion: "1",
    status: row.status,
    serverImageDigest: row.server_image_digest,
    evidenceDigest: row.evidence_digest,
    files: JSON.parse(row.files ?? "[]"),
    network: JSON.parse(row.network ?? "[]"),
    executables: JSON.parse(row.executables ?? "[]"),
    requiredControls: JSON.parse(row.required_controls ?? "[]"),
    reviewRequired: JSON.parse(row.review_required ?? "[]"),
    approvedBy: row.approved_by ?? undefined,
  };
}

export function deletePolicy(id: string, workspaceId: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM policies WHERE id = ? AND workspace_id = ?").run(id, workspaceId);
  return (result.changes ?? 0) > 0;
}

export function updatePolicy(id: string, workspaceId: string, data: Policy): boolean {
  const db = getDb();
  const result = db.prepare("UPDATE policies SET status = ?, server_image_digest = ?, evidence_digest = ?, files = ?, network = ?, executables = ?, required_controls = ?, review_required = ?, approved_by = ?, updated_at = ? WHERE id = ? AND workspace_id = ?").run(
    data.status,
    data.serverImageDigest,
    data.evidenceDigest,
    JSON.stringify(data.files),
    JSON.stringify(data.network),
    JSON.stringify(data.executables),
    JSON.stringify(data.requiredControls),
    JSON.stringify(data.reviewRequired ?? []),
    data.approvedBy ?? null,
    nowIso(),
    id,
    workspaceId,
  );
  return (result.changes ?? 0) > 0;
}

export function createPolicy(workspaceId: string, data: Policy): Policy {
  const db = getDb();
  const id = uid("pol");
  db.prepare("INSERT INTO policies (id, workspace_id, status, server_image_digest, evidence_digest, files, network, executables, required_controls, review_required, approved_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, workspaceId, data.status, data.serverImageDigest, data.evidenceDigest, JSON.stringify(data.files), JSON.stringify(data.network), JSON.stringify(data.executables), JSON.stringify(data.requiredControls), JSON.stringify(data.reviewRequired ?? []), data.approvedBy ?? null, nowIso(), nowIso());
  logAudit({ workspaceId, action: "policy.created", targetType: "policy", targetId: id, metadata: { status: data.status } });
  return { ...data, id };
}

export function assessPolicy(policyId: string, scanId: string): { assessment: Assessment; policy: Policy } {
  const db = getDb();
  const policyRow = db.prepare("SELECT * FROM policies WHERE id = ?").get(policyId) as any;
  const scanRow = db.prepare("SELECT * FROM scans WHERE id = ?").get(scanId) as any;
  if (!policyRow || !scanRow) throw new Error("policy or scan not found");
  const policy = {
    schemaVersion: "1",
    status: policyRow.status,
    serverImageDigest: policyRow.server_image_digest,
    evidenceDigest: policyRow.evidence_digest,
    files: JSON.parse(policyRow.files ?? "[]"),
    network: JSON.parse(policyRow.network ?? "[]"),
    executables: JSON.parse(policyRow.executables ?? "[]"),
    requiredControls: JSON.parse(policyRow.required_controls ?? "[]"),
    reviewRequired: JSON.parse(policyRow.review_required ?? "[]"),
    approvedBy: policyRow.approved_by ?? undefined,
  } as Policy;
  const lock = JSON.parse(scanRow.events ? scanRow.events : "{}") as Lockfile;
  const assessment = assessCandidate(policy, lock);
  const id = uid("as");
  db.prepare("INSERT INTO assessments (id, policy_id, scan_id, unapproved, identity_changed, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, policyId, scanId, JSON.stringify(assessment.unapproved), assessment.identityChanged ? 1 : 0, nowIso());
  return { assessment, policy };
}

export function listApiKeys(userId: string, workspaceId: string) {
  const db = getDb();
  return (db.prepare("SELECT id, user_id AS userId, workspace_id AS workspaceId, name, key_prefix AS keyPrefix, last_used_at AS lastUsedAt, revoked_at AS revokedAt, created_at AS createdAt FROM api_keys WHERE user_id = ? AND workspace_id = ? ORDER BY created_at DESC").all(userId, workspaceId) as any[]).map((r) => ({ id: r.id, userId: r.userId, workspaceId: r.workspaceId, name: r.name, keyPrefix: r.keyPrefix, lastUsedAt: r.lastUsedAt ?? undefined, revokedAt: r.revokedAt ?? undefined, createdAt: r.createdAt }));
}

export function createApiKey(userId: string, workspaceId: string, name: string): { key: string; record: Record<string, unknown> } {
  const db = getDb();
  const token = `mcp_lock_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const id = uid("key");
  db.prepare("INSERT INTO api_keys (id, user_id, workspace_id, name, key_prefix, key_hash, last_used_at, revoked_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)").run(id, userId, workspaceId, name, token.slice(0, 12), `sha256:${token}`, nowIso());
  return { key: token, record: { id, userId, workspaceId, name, keyPrefix: token.slice(0, 12), lastUsedAt: undefined, revokedAt: undefined, createdAt: nowIso() } };
}

export function revokeApiKey(id: string) {
  const db = getDb();
  db.prepare("UPDATE api_keys SET revoked_at = ? WHERE id = ?").run(nowIso(), id);
}

export function listAuditEvents(workspaceId?: string, limit = 50, offset = 0) {
  const db = getDb();
  const rows = workspaceId
    ? (db.prepare("SELECT * FROM audit_events WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?").all(workspaceId, limit, offset) as any[])
    : (db.prepare("SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset) as any[]);
  return rows.map((r) => ({ id: r.id, workspaceId: r.workspace_id ?? undefined, userId: r.user_id ?? undefined, action: r.action, targetType: r.target_type ?? undefined, targetId: r.target_id ?? undefined, metadata: r.metadata ? JSON.parse(r.metadata as string) : undefined, createdAt: r.created_at })) as AuditEvent[];
}
