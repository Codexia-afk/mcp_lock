// Session, credential and audit helpers for the mcp-lock developer platform.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";

export const SESSION_COOKIE = "mcp_lock_session";
export const CSRF_COOKIE = "mcp_lock_csrf";
export const OAUTH_STATE_COOKIE = "mcp_lock_oauth_state";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createApiKeyToken(): string {
  return `mcp_lock_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export async function getSessionUser(req: { headers: Headers }): Promise<{ userId: string; email: string } | null> {
  const header = req.headers.get("cookie") ?? "";
  const token = readCookie(header, SESSION_COOKIE);
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.token AS token, s.expires_at AS expiresAt, u.id AS userId, u.email AS email
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as { token: string; expiresAt: string; userId: string; email: string } | undefined;
  if (!row) return null;
  // Touch the session expiry lazily.
  db.prepare("UPDATE sessions SET expires_at = ? WHERE token = ?").run(new Date(Date.now() + SESSION_TTL_MS).toISOString(), token);
  return { userId: row.userId, email: row.email };
}

function readCookie(header: string, name: string): string | null {
  const match = header.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.slice(name.length + 1);
  return value.length > 0 ? value : null;
}

export async function createUserSession(userId: string): Promise<string> {
  const token = createSessionToken();
  const db = getDb();
  db.prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(token, userId, new Date(Date.now() + SESSION_TTL_MS).toISOString(), new Date().toISOString());
  return token;
}

export async function destroyUserSession(token: string): Promise<void> {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const parts = passwordHash.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function logAudit(args: { workspaceId?: string; userId?: string; action: string; targetType?: string; targetId?: string; metadata?: Record<string, unknown> }): void {
  const db = getDb();
  db.prepare("INSERT INTO audit_events (id, workspace_id, user_id, action, target_type, target_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    randomBytes(12).toString("hex"),
    args.workspaceId ?? null,
    args.userId ?? null,
    args.action,
    args.targetType ?? null,
    args.targetId ?? null,
    args.metadata ? JSON.stringify(args.metadata) : null,
    new Date().toISOString(),
  );
}
