import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

let db: DatabaseSync | null = null;

function databasePath(): string {
  const raw = process.env.MCP_LOCK_DATABASE_URL ?? "file:./data/mcp-lock.db";
  const withoutScheme = raw.startsWith("file:") ? raw.slice(5) : raw;
  const path = withoutScheme.startsWith("mem:") ? ":memory:" : resolve(process.cwd(), withoutScheme);
  if (!withoutScheme.startsWith("mem:") && !path.startsWith("mem:")) {
    mkdirSync(dirname(path), { recursive: true });
  }
  return path;
}

export function getDb(): DatabaseSync {
  if (db) return db;
  db = new DatabaseSync(databasePath());
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      password_hash TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (workspace_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      package_name TEXT,
      version TEXT,
      source TEXT,
      image_digest TEXT,
      registered_at TEXT NOT NULL,
      last_scanned_at TEXT,
      baseline_lock_id TEXT
    );
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL,
      status TEXT NOT NULL,
      backend TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      scenario_suite TEXT,
      fixture_digest TEXT,
      evidence_digest TEXT NOT NULL,
      complete INTEGER NOT NULL,
      protocol_version TEXT,
      observer_backend TEXT,
      observer_lost_events INTEGER,
      events TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lockfiles (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL,
      scan_id TEXT,
      version TEXT NOT NULL,
      data TEXT NOT NULL,
      evidence_digest TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS diffs (
      id TEXT PRIMARY KEY,
      baseline_lock_id TEXT NOT NULL,
      candidate_lock_id TEXT NOT NULL,
      added TEXT NOT NULL DEFAULT '[]',
      removed TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL,
      identity_changed INTEGER NOT NULL DEFAULT 0,
      auto_approve_narrower INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      status TEXT NOT NULL,
      server_image_digest TEXT NOT NULL,
      evidence_digest TEXT NOT NULL,
      files TEXT NOT NULL DEFAULT '[]',
      network TEXT NOT NULL DEFAULT '[]',
      executables TEXT NOT NULL DEFAULT '[]',
      required_controls TEXT NOT NULL DEFAULT '["filesystem","network","process"]',
      review_required TEXT NOT NULL DEFAULT '[]',
      approved_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      policy_id TEXT NOT NULL,
      scan_id TEXT NOT NULL,
      unapproved TEXT NOT NULL DEFAULT '[]',
      identity_changed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      last_used_at TEXT,
      revoked_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_scans_server_started ON scans(server_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_lockfiles_server_created ON lockfiles(server_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_policies_workspace ON policies(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_activity_workspace_created ON audit_events(workspace_id, created_at DESC);
  `);
  return db;
}

export function resetDbForTests() {
  // Not used in production; exposed for integration tests against a temp database.
  const database = getDb();
  database.exec("DELETE FROM users");
  database.exec("DELETE FROM sessions");
  database.exec("DELETE FROM workspaces");
  database.exec("DELETE FROM memberships");
  database.exec("DELETE FROM projects");
  database.exec("DELETE FROM servers");
  database.exec("DELETE FROM scans");
  database.exec("DELETE FROM lockfiles");
  database.exec("DELETE FROM diffs");
  database.exec("DELETE FROM policies");
  database.exec("DELETE FROM assessments");
  database.exec("DELETE FROM api_keys");
  database.exec("DELETE FROM audit_events");
}
