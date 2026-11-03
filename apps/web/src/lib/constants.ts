export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const GITHUB_REPOSITORY_URL = process.env.NEXT_PUBLIC_GITHUB_REPOSITORY_URL ?? "https://github.com/Codexia-afk/mcp_lock";
export const GITHUB_REPOSITORY = process.env.NEXT_PUBLIC_GITHUB_REPOSITORY ?? "github.com/Codexia-afk/mcp_lock";
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "mcp-lock";

export const LOCK_SCHEMA_VERSION = "1";
export const POLICY_SCHEMA_VERSION = "1";
export const CONFIG_SCHEMA_VERSION = "1";

export const OBSERVER_BACKENDS = ["docker-strace-linux-v1", "emulated-tracer-v1"];
export const PROTOCOL_VERSION = "2026-07-28";

export const INSTALL_STEPS = [
  { id: "prerequisites", label: "Install prerequisites" },
  { id: "install", label: "Install mcp-lock" },
  { id: "verify", label: "Verify environment" },
  { id: "example", label: "Run an example" },
  { id: "lockfile", label: "Generate a behavioral lockfile" },
  { id: "review", label: "Review your results" },
] as const;

export const CI_WORKFLOW = `name: mcp-lock Behavioral Audit
on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Codexia-afk/mcp_lock/.github/actions/mcp-lock
        with:
          config: mcp-lock.json
          lockfile: behavior.lock
          auto-approve-narrower: 'true'`;

export const EXAMPLE_LOCKFILE_JSON = `{
  "schemaVersion": "1",
  "server": {
    "imageDigest": "sha256:...",
    "entrypoint": ["/app/server"]
  },
  "protocol": {
    "version": "2026-07-28",
    "transport": "stdio"
  },
  "scenarioSuite": {
    "digest": "sha256:...",
    "fixtureDigest": "sha256:...",
    "completed": 1,
    "total": 1
  },
  "environment": {
    "imageDigest": "sha256:...",
    "kernel": "linux",
    "arch": "amd64"
  },
  "observer": {
    "backend": "docker-strace-linux-v1",
    "version": "0.1.0",
    "lostEvents": 0,
    "status": "complete"
  },
  "observations": [
    {
      "kind": "file.read",
      "target": "/fixtures/public.txt",
      "outcome": "allowed",
      "scenario": "read",
      "count": 1
    }
  ],
  "evidenceDigest": "sha256:..."
}`;

export const EXAMPLE_POLICY_JSON = `{
  "schemaVersion": "1",
  "status": "approved",
  "serverImageDigest": "sha256:...",
  "evidenceDigest": "sha256:...",
  "files": [
    { "path": "/fixtures/public.txt", "access": "read" }
  ],
  "network": [],
  "executables": [
    { "path": "/app/server", "digest": "sha256:..." }
  ],
  "requiredControls": ["filesystem", "network", "process"],
  "approvedBy": "security-reviewer@example.com"
}`;
