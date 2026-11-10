import { getDb } from "@/lib/db";
import { computeEvidenceDigest, type Lockfile, type Observation } from "@/lib/lockfile";
import { createDiff, createLockfileFromScan, createPolicy, createServer, createWorkspace, createProject, ingestScan } from "@/lib/queries";
import { getMembership } from "@/lib/queries";

const IMAGE_BASELINE = `sha256:${"a".repeat(64)}`;
const IMAGE_CHANGED = `sha256:${"b".repeat(64)}`;
const EXEC_DIGEST = `sha256:${"c".repeat(64)}`;

function buildBaseline(): Lockfile {
  const observations: Observation[] = [{ kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 }];
  return {
    schemaVersion: "1",
    server: { imageDigest: IMAGE_BASELINE, entrypoint: ["/app/server"] },
    protocol: { version: "2026-07-28", transport: "stdio" },
    scenarioSuite: { digest: IMAGE_BASELINE, fixtureDigest: IMAGE_BASELINE, completed: 1, total: 1 },
    environment: { imageDigest: IMAGE_BASELINE, kernel: "linux", arch: "amd64" },
    observer: { backend: "docker-strace-linux-v1", version: "0.1.0", lostEvents: 0, status: "complete" },
    observations,
    evidenceDigest: computeEvidenceDigest(IMAGE_BASELINE, IMAGE_BASELINE, observations),
  };
}

function buildChanged(): Lockfile {
  const observations: Observation[] = [
    { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
    { kind: "file.read", target: "/fixtures/secret.txt", outcome: "allowed", scenario: "read", count: 1 },
  ];
  return {
    schemaVersion: "1",
    server: { imageDigest: IMAGE_CHANGED, entrypoint: ["/app/server"] },
    protocol: { version: "2026-07-28", transport: "stdio" },
    scenarioSuite: { digest: IMAGE_BASELINE, fixtureDigest: IMAGE_BASELINE, completed: 1, total: 1 },
    environment: { imageDigest: IMAGE_CHANGED, kernel: "linux", arch: "amd64" },
    observer: { backend: "docker-strace-linux-v1", version: "0.1.0", lostEvents: 0, status: "complete" },
    observations,
    evidenceDigest: computeEvidenceDigest(IMAGE_CHANGED, IMAGE_BASELINE, observations),
  };
}

export function createSampleWorkspace(userId: string): { workspaceId: string } {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM workspaces WHERE slug = 'sample-workspace'").get() as any;
  const ownerMembership = existing ? getMembership(userId, existing.id) : null;
  if (ownerMembership) {
    return { workspaceId: existing.id };
  }

  const workspace = createWorkspace(userId, "Sample workspace");
  const project = createProject(workspace.id, "demo-mcp-server", "Sample workspace demonstrating behavioral drift detection.");
  const server = createServer(workspace.id, project.id, {
    name: "mcp-server-echo",
    packageName: "@example/mcp-server-echo",
    version: "1.0.0",
    source: "npm",
    imageDigest: IMAGE_BASELINE,
  });

  const baselineLock = buildBaseline();
  const changedLock = buildChanged();
  const baselineScan = ingestScan(server.id, IMAGE_BASELINE, "completed", "docker-strace-linux-v1", baselineLock.observations);
  const changedScan = ingestScan(server.id, IMAGE_CHANGED, "completed", "docker-strace-linux-v1", changedLock.observations);
  const baselineLockId = createLockfileFromScan(server.id, "v1", baselineScan.id, baselineLock);
  const changedLockId = createLockfileFromScan(server.id, "v2", changedScan.id, changedLock);
  const { report } = createDiff(baselineLockId, changedLockId, false);
  void report;
  const policy = createPolicy(workspace.id, {
    schemaVersion: "1",
    status: "approved",
    serverImageDigest: IMAGE_BASELINE,
    evidenceDigest: baselineLock.evidenceDigest,
    files: [{ path: "/fixtures/public.txt", access: "read" }],
    network: [],
    executables: [{ path: "/app/server", digest: EXEC_DIGEST }],
    requiredControls: ["filesystem", "network", "process"],
    approvedBy: "security-reviewer@example.com",
  });
  void policy;

  return { workspaceId: workspace.id };
}
