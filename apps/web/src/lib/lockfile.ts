// TypeScript port of the Go behavioral lockfile engine semantics
// (internal/lockfile, internal/policy) so the SaaS backend can validate,
// compare, and assess behavior.lock / policy files without re-implementing
// security-critical semantics incorrectly.

import { createHash } from "node:crypto";

export interface Observation {
  kind: string;
  target: string;
  objectDigest?: string;
  outcome: "allowed" | "denied";
  scenario: string;
  count: number;
}

export interface Lockfile {
  schemaVersion: string;
  server: { imageDigest: string; entrypoint: string[] };
  protocol: { version: string; transport: string };
  scenarioSuite: { digest: string; fixtureDigest: string; completed: number; total: number };
  environment: { imageDigest: string; kernel: string; arch: string };
  observer: { backend: string; version: string; lostEvents?: number | null; status: string };
  observations: Observation[];
  evidenceDigest: string;
}

export interface DiffResult {
  comparable: boolean;
  reasons: string[];
  added: Observation[];
  removed: Observation[];
}

const SHA256 = /^sha256:[0-9a-f]{64}$/;

export function isSha256Digest(value: string): boolean {
  return SHA256.test(value);
}

export function isComplete(l: Lockfile): boolean {
  return l.observer.status === "complete" && l.observer.lostEvents != null && l.observer.lostEvents === 0 && l.scenarioSuite.completed === l.scenarioSuite.total;
}

export function validateLockfile(input: unknown): Lockfile {
  const l = input as Lockfile;
  const fail = (message: string): never => {
    throw new Error(`behavior.lock validation failed: ${message}`);
  };
  if (l.schemaVersion !== "1") fail(`unsupported schemaVersion ${JSON.stringify(l.schemaVersion)}`);
  if (!isSha256Digest(l.server.imageDigest) || !Array.isArray(l.server.entrypoint) || l.server.entrypoint.length === 0) {
    fail("server image digest and entrypoint are required");
  }
  if (!l.protocol.version || l.protocol.transport !== "stdio") fail("a protocol version and stdio transport are required");
  const suite = l.scenarioSuite;
  if (!isSha256Digest(suite.digest) || !isSha256Digest(suite.fixtureDigest) || !(suite.total >= 1) || !(suite.completed >= 0) || suite.completed > suite.total) {
    fail("invalid scenario suite or completion count");
  }
  if (!isSha256Digest(l.environment.imageDigest) || !l.environment.kernel || !l.environment.arch) fail("environment image digest, kernel and architecture are required");
  if (!l.observer.backend || !l.observer.version || !l.observer.status) fail("observer backend, version and status are required");
  if (l.observer.status !== "complete" && l.observer.status !== "incomplete") fail("observer status must be complete or incomplete");
  if (l.observer.lostEvents != null && l.observer.lostEvents < 0) fail("lostEvents cannot be negative");
  if (!isSha256Digest(l.evidenceDigest)) fail("evidenceDigest must be a SHA-256 digest");

  const seen = new Set<string>();
  for (const o of l.observations) {
    if (!o.kind || !o.target || !o.outcome || !o.scenario || !(o.count >= 1)) fail("invalid observation");
    if (o.outcome !== "allowed" && o.outcome !== "denied") fail(`invalid observation outcome ${JSON.stringify(o.outcome)}`);
    if (o.kind === "file.read" || o.kind === "file.write" || o.kind === "process.exec") {
      if (!o.target.startsWith("/") || o.target !== cleanPath(o.target) || o.target.includes("\x00")) fail(`invalid path target ${JSON.stringify(o.target)}`);
    }
    if (o.kind === "network.connect") {
      const host = hostPort(o.target);
      if (!host) {
        fail(`invalid network target ${JSON.stringify(o.target)}`);
      } else if (!(host.port >= 1 && host.port <= 65535)) {
        fail(`invalid network port in ${JSON.stringify(o.target)}`);
      }
    }
    if (o.kind === "process.exec" && !isSha256Digest(o.objectDigest ?? "")) fail("process.exec observation needs executable digest");
    const key = observationKey(o);
    if (seen.has(key)) fail(`duplicate observation ${JSON.stringify(key)}`);
    seen.add(key);
  }
  return l;
}

function cleanPath(p: string): string {
  // Mirror Go's path.Clean semantics for absolute POSIX paths.
  const parts = p.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return `/${stack.join("/")}`;
}

function hostPort(target: string): { host: string; port: number } | null {
  const idx = target.lastIndexOf(":");
  if (idx <= 0) return null;
  const host = target.slice(0, idx);
  const port = Number(target.slice(idx + 1));
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  if (!host) return null;
  return { host, port };
}

export function observationKey(o: Observation): string {
  return [o.kind, o.target, o.objectDigest ?? "", o.outcome, o.scenario].join("\x00");
}

export function computeEvidenceDigest(serverImage: string, suiteDigest: string, observations: Observation[]): string {
  const sorted = [...observations].sort((a, b) => {
    const ka = [a.kind, a.target, a.outcome, a.scenario].join("\x00");
    const kb = [b.kind, b.target, b.outcome, b.scenario].join("\x00");
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const payload = JSON.stringify(sorted);
  const input = `server:${serverImage}\nsuite:${suiteDigest}\n${payload}`;
  const hash = createHash("sha256").update(input).digest("hex");
  return `sha256:${hash}`;
}

export function compareLocks(a: Lockfile, b: Lockfile): DiffResult {
  const d: DiffResult = { comparable: true, reasons: [], added: [], removed: [] };
  if (!isComplete(a) || !isComplete(b)) d.reasons.push("one or both scans have incomplete evidence");
  if (a.protocol.version !== b.protocol.version || a.protocol.transport !== b.protocol.transport) d.reasons.push("protocol differs");
  if (a.scenarioSuite.digest !== b.scenarioSuite.digest) d.reasons.push("scenario suite differs");
  if (a.scenarioSuite.fixtureDigest !== b.scenarioSuite.fixtureDigest) d.reasons.push("fixtures differ");
  if (a.scenarioSuite.total !== b.scenarioSuite.total) d.reasons.push("scenario count differs");
  if (a.environment.imageDigest !== b.environment.imageDigest || a.environment.kernel !== b.environment.kernel || a.environment.arch !== b.environment.arch) d.reasons.push("execution environment differs");
  if (a.observer.backend !== b.observer.backend || a.observer.version !== b.observer.version) d.reasons.push("observer differs");
  if (d.reasons.length > 0) {
    d.comparable = false;
    return d;
  }
  const oldMap = new Map<string, Observation>();
  for (const o of a.observations) oldMap.set(observationKey(o), o);
  const newMap = new Map<string, Observation>();
  for (const o of b.observations) newMap.set(observationKey(o), o);
  const added: Observation[] = [];
  const removed: Observation[] = [];
  for (const [k, o] of newMap) if (!oldMap.has(k)) added.push(o);
  for (const [k, o] of oldMap) if (!newMap.has(k)) removed.push(o);
  added.sort((x, y) => observationKey(x).localeCompare(observationKey(y)));
  removed.sort((x, y) => observationKey(x).localeCompare(observationKey(y)));
  d.added = added;
  d.removed = removed;
  return d;
}

export type DiffStatus = "pass" | "review" | "incomplete";

export function diffStatus(d: DiffResult, autoApproveNarrower: boolean, identityChanged: boolean): DiffStatus {
  if (!d.comparable) return "incomplete";
  if (d.added.length > 0) return "review";
  if (d.removed.length > 0) return autoApproveNarrower ? "pass" : "review";
  if (identityChanged && !autoApproveNarrower) return "review";
  return "pass";
}

export function makeDiffReport(d: DiffResult, autoApproveNarrower: boolean, identityChanged: boolean) {
  const status = diffStatus(d, autoApproveNarrower, identityChanged);
  return {
    comparable: d.comparable,
    reasons: d.reasons,
    added: d.added,
    removed: d.removed,
    addedCount: d.added.length,
    removedCount: d.removed.length,
    autoApproveNarrower,
    status,
    identityChanged,
  };
}
