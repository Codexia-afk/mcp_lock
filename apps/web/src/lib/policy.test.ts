import { describe, expect, it } from "vitest";
import {
  assessCandidate,
  proposePolicy,
  validatePolicy,
  type Policy,
} from "./policy";
import { computeEvidenceDigest, type Lockfile, type Observation } from "./lockfile";

const IMAGE_BASELINE = `sha256:${"a".repeat(64)}`;
const IMAGE_CHANGED = `sha256:${"b".repeat(64)}`;
const SUITE_DIGEST = `sha256:${"c".repeat(64)}`;

function createFixtureLockfile(image: string, observations: Observation[]): Lockfile {
  return {
    schemaVersion: "1",
    server: { imageDigest: image, entrypoint: ["/app/server"] },
    protocol: { version: "2026-07-28", transport: "stdio" },
    scenarioSuite: { digest: SUITE_DIGEST, fixtureDigest: SUITE_DIGEST, completed: 1, total: 1 },
    environment: { imageDigest: image, kernel: "linux", arch: "amd64" },
    observer: { backend: "docker-strace-linux-v1", version: "0.1.0", lostEvents: 0, status: "complete" },
    observations,
    evidenceDigest: computeEvidenceDigest(image, SUITE_DIGEST, observations),
  };
}

describe("Policy engine semantics", () => {
  it("proposes a valid policy from clean observations", () => {
    const lock = createFixtureLockfile(IMAGE_BASELINE, [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
      { kind: "process.exec", target: "/app/server", objectDigest: IMAGE_BASELINE, outcome: "allowed", scenario: "read", count: 1 },
    ]);

    const proposed = proposePolicy(lock);
    expect(proposed.status).toBe("proposed");
    expect(proposed.files).toEqual([{ path: "/fixtures/public.txt", access: "read" }]);
    expect(proposed.executables).toEqual([{ path: "/app/server", digest: IMAGE_BASELINE }]);
    expect(validatePolicy(proposed)).toBeDefined();
  });

  it("flags unapproved operations when candidate exceeds approved policy", () => {
    const approvedPolicy: Policy = {
      schemaVersion: "1",
      status: "approved",
      serverImageDigest: IMAGE_BASELINE,
      evidenceDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      files: [{ path: "/fixtures/public.txt", access: "read" }],
      network: [],
      executables: [],
      requiredControls: ["filesystem", "network", "process"],
      approvedBy: "security-team@example.com",
    };

    const candidateLock = createFixtureLockfile(IMAGE_CHANGED, [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
      { kind: "file.read", target: "/fixtures/secret.txt", outcome: "allowed", scenario: "read", count: 1 },
    ]);

    const assessment = assessCandidate(approvedPolicy, candidateLock);
    expect(assessment.identityChanged).toBe(true);
    expect(assessment.unapproved).toHaveLength(1);
    expect(assessment.unapproved[0].target).toBe("/fixtures/secret.txt");
  });

  it("passes assessment when candidate permissions are subset of policy", () => {
    const approvedPolicy: Policy = {
      schemaVersion: "1",
      status: "approved",
      serverImageDigest: IMAGE_BASELINE,
      evidenceDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      files: [
        { path: "/fixtures/public.txt", access: "read" },
        { path: "/fixtures/optional.txt", access: "read" },
      ],
      network: [],
      executables: [],
      requiredControls: ["filesystem"],
      approvedBy: "security-team@example.com",
    };

    const candidateLock = createFixtureLockfile(IMAGE_BASELINE, [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
    ]);

    const assessment = assessCandidate(approvedPolicy, candidateLock);
    expect(assessment.unapproved).toHaveLength(0);
  });
});

