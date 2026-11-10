import { describe, expect, it } from "vitest";
import {
  computeEvidenceDigest,
  compareLocks,
  diffStatus,
  makeDiffReport,
  validateLockfile,
  type Lockfile,
  type Observation,
} from "./lockfile";

const IMAGE_BASELINE = `sha256:${"a".repeat(64)}`;
const IMAGE_CHANGED = `sha256:${"b".repeat(64)}`;
const SUITE_DIGEST = `sha256:${"c".repeat(64)}`;

function createFixtureLockfile(image: string, observations: Observation[], complete = true): Lockfile {
  return {
    schemaVersion: "1",
    server: { imageDigest: image, entrypoint: ["/app/server"] },
    protocol: { version: "2026-07-28", transport: "stdio" },
    scenarioSuite: { digest: SUITE_DIGEST, fixtureDigest: SUITE_DIGEST, completed: complete ? 2 : 1, total: 2 },
    environment: { imageDigest: image, kernel: "linux", arch: "amd64" },
    observer: { backend: "docker-strace-linux-v1", version: "0.1.0", lostEvents: 0, status: complete ? "complete" : "incomplete" },
    observations,
    evidenceDigest: computeEvidenceDigest(image, SUITE_DIGEST, observations),
  };
}

describe("Lockfile semantics", () => {
  it("validates a complete, structurally sound behavior.lock", () => {
    const observations: Observation[] = [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
    ];
    const lock = createFixtureLockfile(IMAGE_BASELINE, observations, true);
    const validated = validateLockfile(lock);
    expect(validated.schemaVersion).toBe("1");
    expect(validated.evidenceDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("throws validation error for invalid outcome", () => {
    const observations: any[] = [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "unknown", scenario: "read", count: 1 },
    ];
    const lock = createFixtureLockfile(IMAGE_BASELINE, observations, true);
    expect(() => validateLockfile(lock)).toThrow(/invalid observation outcome/);
  });

  it("calculates deterministic evidence digest regardless of observation order", () => {
    const obsA: Observation = { kind: "file.read", target: "/fixtures/a.txt", outcome: "allowed", scenario: "s1", count: 1 };
    const obsB: Observation = { kind: "file.read", target: "/fixtures/b.txt", outcome: "allowed", scenario: "s2", count: 1 };

    const digest1 = computeEvidenceDigest(IMAGE_BASELINE, SUITE_DIGEST, [obsA, obsB]);
    const digest2 = computeEvidenceDigest(IMAGE_BASELINE, SUITE_DIGEST, [obsB, obsA]);
    expect(digest1).toBe(digest2);
  });

  it("detects added permissions in candidate lockfile", () => {
    const baselineObs: Observation[] = [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
    ];
    const candidateObs: Observation[] = [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
      { kind: "file.read", target: "/fixtures/secret.txt", outcome: "allowed", scenario: "read", count: 1 },
    ];

    const baseline = createFixtureLockfile(IMAGE_BASELINE, baselineObs);
    const candidate = createFixtureLockfile(IMAGE_BASELINE, candidateObs);

    const diff = compareLocks(baseline, candidate);
    expect(diff.comparable).toBe(true);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].target).toBe("/fixtures/secret.txt");
    expect(diff.removed).toHaveLength(0);

    const report = makeDiffReport(diff, false, false);
    expect(report.status).toBe("review");
    expect(report.addedCount).toBe(1);
  });

  it("auto-approves narrower permissions when flag is true", () => {
    const baselineObs: Observation[] = [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
      { kind: "file.read", target: "/fixtures/old.txt", outcome: "allowed", scenario: "read", count: 1 },
    ];
    const candidateObs: Observation[] = [
      { kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 },
    ];

    const baseline = createFixtureLockfile(IMAGE_BASELINE, baselineObs);
    const candidate = createFixtureLockfile(IMAGE_BASELINE, candidateObs);

    const diff = compareLocks(baseline, candidate);
    expect(diff.comparable).toBe(true);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(1);

    // Without auto-approve narrower: requires review
    expect(diffStatus(diff, false, false)).toBe("review");

    // With auto-approve narrower: passes cleanly
    expect(diffStatus(diff, true, false)).toBe("pass");
  });

  it("marks incomparable when protocol or suite differs", () => {
    const obs: Observation[] = [{ kind: "file.read", target: "/fixtures/public.txt", outcome: "allowed", scenario: "read", count: 1 }];
    const a = createFixtureLockfile(IMAGE_BASELINE, obs);
    const b = createFixtureLockfile(IMAGE_BASELINE, obs);
    b.protocol.version = "2025-11-25";

    const diff = compareLocks(a, b);
    expect(diff.comparable).toBe(false);
    expect(diff.reasons).toContain("protocol differs");
    expect(diffStatus(diff, true, false)).toBe("incomplete");
  });
});

