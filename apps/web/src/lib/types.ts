export type Role = "owner" | "admin" | "member" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface McpServer {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  packageName?: string;
  version?: string;
  source?: string;
  imageDigest?: string;
  registeredAt: string;
  lastScannedAt?: string;
  baselineLockId?: string;
}

export type ScanStatus = "completed" | "incomplete" | "failed";

export interface ScanEvent {
  kind: string;
  target: string;
  objectDigest?: string;
  outcome: "allowed" | "denied";
  scenario: string;
  count: number;
}

export interface Scan {
  id: string;
  serverId: string;
  status: ScanStatus;
  backend: string;
  startedAt: string;
  completedAt?: string;
  scenarioSuite?: string;
  fixtureDigest?: string;
  evidenceDigest: string;
  complete: boolean;
  protocolVersion?: string;
  observerLostEvents?: number;
  observerBackend?: string;
  events: ScanEvent[];
}

export interface Lockfile {
  schemaVersion: string;
  server: { imageDigest: string; entrypoint: string[] };
  protocol: { version: string; transport: string };
  scenarioSuite: { digest: string; fixtureDigest: string; completed: number; total: number };
  environment: { imageDigest: string; kernel: string; arch: string };
  observer: { backend: string; version: string; lostEvents?: number; status: string };
  observations: ScanEvent[];
  evidenceDigest: string;
}

export interface DiffResult {
  comparable: boolean;
  reasons: string[];
  added: ScanEvent[];
  removed: ScanEvent[];
  addedCount: number;
  removedCount: number;
  autoApproveNarrower: boolean;
  status: "pass" | "review" | "incomplete";
  identityChanged: boolean;
}

export interface FileRule {
  path: string;
  access: "read" | "write";
}
export interface NetworkRule {
  host: string;
  port: number;
}
export interface ExecRule {
  path: string;
  digest?: string;
}
export interface Policy {
  id?: string;
  schemaVersion: string;
  status: "proposed" | "approved";
  serverImageDigest: string;
  evidenceDigest: string;
  files: FileRule[];
  network: NetworkRule[];
  executables: ExecRule[];
  requiredControls: string[];
  reviewRequired?: string[];
  approvedBy?: string;
}

export interface PolicyAssessment {
  identityChanged: boolean;
  unapproved: ScanEvent[];
}

export interface ApiKey {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  prefix: string;
  lastUsedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  workspaceId?: string;
  userId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
