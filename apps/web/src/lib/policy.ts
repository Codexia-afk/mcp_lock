// TypeScript port of the Go policy engine semantics (internal/policy).

import { isComplete, isSha256Digest, type Lockfile, type Observation } from "@/lib/lockfile";

export interface FileRule { path: string; access: "read" | "write" }
export interface NetworkRule { host: string; port: number }
export interface ExecRule { path: string; digest?: string }

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

export interface Assessment {
  identityChanged: boolean;
  unapproved: Observation[];
}

export function validatePolicy(input: unknown): Policy {
  const p = input as Policy;
  const fail = (message: string): never => {
    throw new Error(`policy validation failed: ${message}`);
  };
  if (p.schemaVersion !== "1") fail(`unsupported policy schemaVersion ${JSON.stringify(p.schemaVersion)}`);
  if (p.status !== "proposed" && p.status !== "approved") fail("policy status must be proposed or approved");
  if (!isSha256Digest(p.serverImageDigest) || !isSha256Digest(p.evidenceDigest)) fail("policy needs server and evidence SHA-256 digests");
  if (p.status === "approved" && (!p.approvedBy || p.reviewRequired?.length)) {
    fail("approved policy needs approvedBy and cannot have unresolved reviewRequired entries");
  }
  const seenFiles = new Set<string>();
  for (const f of p.files) {
    if (!f.path.startsWith("/") || f.path !== cleanPath(f.path) || (f.access !== "read" && f.access !== "write")) fail(`invalid file rule for ${JSON.stringify(f.path)}`);
    const key = `${f.path}\x00${f.access}`;
    if (seenFiles.has(key)) fail(`duplicate file rule for ${JSON.stringify(key)}`);
    seenFiles.add(key);
  }
  const seenExec = new Set<string>();
  for (const e of p.executables) {
    if (!e.path.startsWith("/") || e.path !== cleanPath(e.path) || (e.digest && !isSha256Digest(e.digest))) fail(`invalid executable rule for ${JSON.stringify(e.path)}`);
    if (p.status === "approved" && !e.digest) fail(`approved executable rule for ${JSON.stringify(e.path)} needs a digest`);
    if (seenExec.has(e.path)) fail(`duplicate executable rule for ${JSON.stringify(e.path)}`);
    seenExec.add(e.path);
  }
  const seenNetwork = new Set<string>();
  for (const n of p.network) {
    if (!n.host || !(n.port >= 1 && n.port <= 65535)) fail(`invalid network rule for ${JSON.stringify(n.host)}`);
    const key = `${n.host}:${n.port}`;
    if (seenNetwork.has(key)) fail(`duplicate network rule for ${JSON.stringify(key)}`);
    seenNetwork.add(key);
  }
  const controls = new Set<string>();
  for (const c of p.requiredControls) {
    if (c !== "filesystem" && c !== "network" && c !== "process") fail(`unknown required control ${JSON.stringify(c)}`);
    if (controls.has(c)) fail(`duplicate required control ${JSON.stringify(c)}`);
    controls.add(c);
  }
  if (!controls.has("filesystem") || !controls.has("network") || !controls.has("process")) fail("all three required controls must be listed");
  return p;
}

export function cleanPath(p: string): string {
  const stack: string[] = [];
  for (const part of p.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return `/${stack.join("/")}`;
}

export function proposePolicy(l: Lockfile): Policy {
  if (!isComplete(l)) throw new Error("cannot propose a policy from incomplete evidence");
  const files: FileRule[] = [];
  const seen = new Set<string>();
  const execs: ExecRule[] = [];
  const execSeen = new Set<string>();
  const reviewRequired: string[] = [];
  for (const o of l.observations) {
    if (o.outcome !== "allowed") continue;
    if (o.kind === "file.read" || o.kind === "file.write") {
      const access: "read" | "write" = o.kind === "file.write" ? "write" : "read";
      const key = `${o.target}\x00${access}`;
      if (!seen.has(key)) {
        seen.add(key);
        files.push({ path: o.target, access });
      }
    } else if (o.kind === "process.exec") {
      if (!execSeen.has(o.target)) {
        execSeen.add(o.target);
        execs.push({ path: o.target, digest: o.objectDigest });
      }
    } else if (o.kind === "network.connect") {
      reviewRequired.push(`network destination ${o.target} requires manual proxy rule review`);
    }
  }
  return {
    schemaVersion: "1",
    status: "proposed",
    serverImageDigest: l.server.imageDigest,
    evidenceDigest: l.evidenceDigest,
    files,
    network: [],
    executables: execs,
    requiredControls: ["filesystem", "network", "process"],
    reviewRequired: reviewRequired.sort(),
  };
}

export function assessCandidate(p: Policy, l: Lockfile): Assessment {
  if (p.status !== "approved") throw new Error("policy must be approved");
  if (!isComplete(l)) throw new Error("candidate evidence is incomplete");
  const identityChanged = p.serverImageDigest !== l.server.imageDigest;
  const unapproved: Observation[] = [];
  for (const o of l.observations) {
    if (o.outcome !== "allowed") {
      unapproved.push(o);
      continue;
    }
    let permitted = false;
    if (o.kind === "file.read" || o.kind === "file.write") {
      permitted = p.files.some((r) => r.path === o.target && `file.${r.access}` === o.kind);
    } else if (o.kind === "process.exec") {
      permitted = p.executables.some((r) => r.path === o.target && r.digest === o.objectDigest);
    } else if (o.kind === "network.connect") {
      const hp = hostPort(o.target);
      permitted = hp != null && p.network.some((r) => r.host === hp.host && r.port === hp.port);
    }
    if (!permitted) unapproved.push(o);
  }
  return { identityChanged, unapproved };
}

function hostPort(target: string): { host: string; port: number } | null {
  const idx = target.lastIndexOf(":");
  if (idx <= 0) return null;
  const port = Number(target.slice(idx + 1));
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  const host = target.slice(0, idx);
  if (!host) return null;
  return { host, port };
}
