import { describe, expect, it, beforeEach } from "vitest";
import { getDb } from "./db";
import {
  createApiKey,
  createDiff,
  createLockfileFromScan,
  createPolicy,
  createProject,
  createServer,
  createUser,
  createWorkspace,
  getLockfileForWorkspace,
  ingestScan,
  listApiKeys,
  listDiffs,
  listLockfiles,
  listPolicies,
  listProjects,
  listScans,
  listServers,
  listWorkspacesForUser,
} from "./queries";
import { computeEvidenceDigest, type Lockfile, type Observation } from "./lockfile";

describe("Database and Queries with SQLite", () => {
  beforeEach(() => {
    process.env.MCP_LOCK_DATABASE_URL = "mem:test.db";
  });

  it("creates a user and workspace, registers projects, servers, scans and lockfiles", () => {
    const user = createUser("Alice Developer", "alice@example.com", "hash123");
    expect(user.id).toBeDefined();

    const workspaces = listWorkspacesForUser(user.id);
    expect(workspaces).toHaveLength(1);
    const ws = workspaces[0];
    expect(ws.name).toContain("Alice Developer");

    const project = createProject(ws.id, "prod-agent", "Production agent tools");
    expect(project.id).toBeDefined();

    const projects = listProjects(ws.id);
    expect(projects).toHaveLength(1);

    const imageDigest = `sha256:${"1".repeat(64)}`;
    const server = createServer(ws.id, project.id, {
      name: "mcp-filesystem",
      packageName: "@modelcontextprotocol/server-filesystem",
      version: "1.0.0",
      source: "npm",
      imageDigest,
    });
    expect(server.id).toBeDefined();

    const observations: Observation[] = [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
    ];
    const scan = ingestScan(server.id, imageDigest, "completed", "docker-strace-linux-v1", observations);
    expect(scan.id).toBeDefined();
    expect(scan.complete).toBe(true);

    const scans = listScans(server.id);
    expect(scans).toHaveLength(1);

    const lock: Lockfile = {
      schemaVersion: "1",
      server: { imageDigest, entrypoint: ["/app/server"] },
      protocol: { version: "2026-07-28", transport: "stdio" },
      scenarioSuite: { digest: imageDigest, fixtureDigest: imageDigest, completed: 1, total: 1 },
      environment: { imageDigest, kernel: "linux", arch: "amd64" },
      observer: { backend: "docker-strace-linux-v1", version: "0.1.0", lostEvents: 0, status: "complete" },
      observations,
      evidenceDigest: computeEvidenceDigest(imageDigest, imageDigest, observations),
    };

    const lockId = createLockfileFromScan(server.id, "v1.0.0", scan.id, lock);
    expect(lockId).toBeDefined();

    const lockfiles = listLockfiles(server.id);
    expect(lockfiles).toHaveLength(1);

    const fetchedLock = getLockfileForWorkspace(lockId, ws.id);
    expect(fetchedLock).toBeDefined();
    expect(fetchedLock?.version).toBe("v1.0.0");
  });

  it("handles diffing and policy lifecycle in the workspace", () => {
    const user = createUser("Bob Security", "bob@example.com", "hash456");
    const ws = listWorkspacesForUser(user.id)[0];
    const project = createProject(ws.id, "diff-project");
    const img1 = `sha256:${"a".repeat(64)}`;
    const img2 = `sha256:${"b".repeat(64)}`;

    const server = createServer(ws.id, project.id, {
      name: "diff-server",
      imageDigest: img1,
    });

    const obs1: Observation[] = [{ kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "s1", count: 1 }];
    const obs2: Observation[] = [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "s1", count: 1 },
      { kind: "file.read", target: "/fixtures/secret.txt", outcome: "allowed", scenario: "s1", count: 1 },
    ];

    const scan1 = ingestScan(server.id, img1, "completed", "docker-strace-linux-v1", obs1);
    const scan2 = ingestScan(server.id, img2, "completed", "docker-strace-linux-v1", obs2);

    const suiteDigest = `sha256:${"0".repeat(64)}`;
    const sandboxEnv = `sha256:${"9".repeat(64)}`;
    const lock1: Lockfile = {
      schemaVersion: "1",
      server: { imageDigest: img1, entrypoint: ["/app/server"] },
      protocol: { version: "2026-07-28", transport: "stdio" },
      scenarioSuite: { digest: suiteDigest, fixtureDigest: suiteDigest, completed: 1, total: 1 },
      environment: { imageDigest: sandboxEnv, kernel: "linux", arch: "amd64" },
      observer: { backend: "docker-strace-linux-v1", version: "0.1.0", lostEvents: 0, status: "complete" },
      observations: obs1,
      evidenceDigest: computeEvidenceDigest(img1, suiteDigest, obs1),
    };
    const lock2: Lockfile = {
      schemaVersion: "1",
      server: { imageDigest: img2, entrypoint: ["/app/server"] },
      protocol: { version: "2026-07-28", transport: "stdio" },
      scenarioSuite: { digest: suiteDigest, fixtureDigest: suiteDigest, completed: 1, total: 1 },
      environment: { imageDigest: sandboxEnv, kernel: "linux", arch: "amd64" },
      observer: { backend: "docker-strace-linux-v1", version: "0.1.0", lostEvents: 0, status: "complete" },
      observations: obs2,
      evidenceDigest: computeEvidenceDigest(img2, suiteDigest, obs2),
    };

    const lockId1 = createLockfileFromScan(server.id, "v1", scan1.id, lock1);
    const lockId2 = createLockfileFromScan(server.id, "v2", scan2.id, lock2);

    const { diff, report } = createDiff(lockId1, lockId2, false);
    expect(diff.comparable).toBe(true);
    expect(report.status).toBe("review");
    expect(report.addedCount).toBe(1);

    const policy = createPolicy(ws.id, {
      schemaVersion: "1",
      status: "approved",
      serverImageDigest: img1,
      evidenceDigest: lock1.evidenceDigest,
      files: [{ path: "/fixtures/public.txt", access: "read" }],
      network: [],
      executables: [],
      requiredControls: ["filesystem"],
      approvedBy: "bob@example.com",
    });
    expect(policy.id).toBeDefined();

    const policies = listPolicies(ws.id);
    expect(policies).toHaveLength(1);
    expect(policies[0].status).toBe("approved");

    const apiKey = createApiKey(user.id, ws.id, "CI Runner");
    expect(apiKey.key).toMatch(/^mcp_lock_/);
    expect(apiKey.record.keyPrefix).toBeDefined();

    const keys = listApiKeys(user.id, ws.id);
    expect(keys).toHaveLength(1);
  });
});
