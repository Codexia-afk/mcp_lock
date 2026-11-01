# mcp-lock

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![mcp-lock: verified behavior](https://img.shields.io/badge/mcp--lock-verified_behavior-2ea44f?logo=shield)](docs/BADGE.md)
[![Go Version](https://img.shields.io/badge/go-1.26+-00ADD8?logo=go)](go.mod)
[![MCP Spec](https://img.shields.io/badge/MCP-2026--07--28-6f42c1)](https://modelcontextprotocol.io)

**Behavioral evidence, reviewed permission lockfiles, and author-side trust for Model Context Protocol (MCP) servers.**

---

## What is `mcp-lock`?

`mcp-lock` brings deterministic, reproducible operating-system behavioral verification to MCP servers. Instead of trusting static descriptions and unverified JSON schemas, `mcp-lock` runs servers in an isolated Linux sandbox, traces low-level OS operations (filesystem access, network connections, and subprocess executions), and records them in a version-controlled `behavior.lock`.

### The Author-Side Wedge

Most security tools act as consumer-side barriers (blocking installations after the fact). `mcp-lock` is built **maintainer-first**:

1. **Proof of Innocence:** Maintainers can cryptographically prove their server only touches what it advertises.
2. **Supply Chain Defense:** The maintainer's GitHub Action blocks pull requests where compromised dependencies quietly add outbound network connections or scan local files.
3. **Verified Trust Badge:** Maintainers embed the `[![mcp-lock: verified]](behavior.lock)` badge in their README, signaling enterprise safety to users of Claude Desktop, Antigravity, Cursor, Zed, and Codex.
4. **Auto-Approved Bumps:** With `--auto-approve-narrower`, routine code updates that don't expand operating system permissions pass CI automatically without manual security review.

---

## Key Features

- **Frictionless `npx` & `uvx` Auto-Wrapping:** No need to manually build OCI containers. Run `mcp-lock observe -- npx -y @pkg@1.2.3` or `mcp-lock wrap --uvx mcp-server-git`, and `mcp-lock` automatically builds an isolated, pinned image with non-root UID `65532:65532`.
- **Auto-Generated Starter Scenarios:** Eliminates the biggest barrier to adoption. `mcp-lock init` and `scenario generate` inspect your server's `tools/list` JSON schema and synthesize type-safe, non-destructive test inputs automatically.
- **Protocol Support:** Full support for modern stateless MCP (`2026-07-28` `server/discover`) and legacy handshake fallback (`2025-11-25` `initialize`).
- **OS Behavioral Observation:** Contained Linux `strace` observer (`docker-strace-linux-v1`) and deterministic emulated backend (`emulated-tracer-v1`) capturing raw syscalls, normalising paths, and tracking telemetry loss counters.
- **Semantic Diff & Smart Auto-Approval:** Distinguishes added vs removed access. With `--auto-approve-narrower`, updates whose permissions are identical or a subset of baseline pass CI cleanly.
- **Maintainer Tooling:** Includes a turnkey GitHub Action (`.github/actions/mcp-lock/action.yml`) and Markdown badge generator (`mcp-lock badge`).

---

## Quickstart

### 1. Build and Run Doctor
```sh
go build -ldflags "-X main.version=0.1.0-dev" -o bin/mcp-lock ./cmd/mcp-lock
./bin/mcp-lock doctor
```

Output:
```text
host: darwin/arm64
Docker daemon: linux 29.8.2
status: ready (protocol checks and OS observer available)
backends: docker-strace-linux-v1, emulated-tracer-v1
```

### 2. Zero-Friction Scan (`npx` / `uvx`)
Observe any published MCP package in one step:
```sh
./bin/mcp-lock observe -- npx -y @modelcontextprotocol/server-everything
./bin/mcp-lock badge --lock behavior.lock
```

### 3. Initialize Config with Auto-Generated Scenarios
```sh
# Discover tools and auto-synthesize safe starter scenarios
./bin/mcp-lock init --image sha256:... --out mcp-lock.json
./bin/mcp-lock scenario generate --config mcp-lock.json
```

### 4. Run the Two-Version Release Gate Demo
To see `mcp-lock` distinguish two server versions with identical MCP interfaces and block an unapproved secret read, run:
```sh
./scripts/demo-two-version-gate.sh
```

---

## Developer and CI Workflow

```sh
# 1. Observe server behavior during test suite
mcp-lock observe --config mcp-lock.json --out behavior.lock

# 2. Validate lockfile against canonical JSON Schema
mcp-lock validate --lock behavior.lock

# 3. Compare candidate against baseline in CI (auto-approving identical/narrower permissions)
mcp-lock diff --from baseline.lock --to candidate.lock --auto-approve-narrower

# Machine-readable diff report for CI and tooling
mcp-lock diff --from baseline.lock --to candidate.lock --json

# 4. Propose and assess reviewed permission policy
mcp-lock policy propose --lock behavior.lock --out proposed-policy.json
mcp-lock policy assess --policy approved-policy.json --lock candidate.lock --allow-narrower

# 5. Generate maintainer trust badge and README summary
mcp-lock badge --lock behavior.lock
```

---

## Maintainer GitHub Action

Add `.github/workflows/audit.yml` to your MCP server repository:

```yaml
name: mcp-lock Audit
on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./mcp-lock/.github/actions/mcp-lock
        with:
          config: mcp-lock.json
          lockfile: behavior.lock
          auto-approve-narrower: 'true'
```

On every pull request, the action automatically:
- Executes `mcp-lock observe` on the candidate image.
- Performs semantic diff against `behavior.lock`.
- Posts a detailed Markdown audit table to the GitHub Step Summary.
- Passes automatically if permissions are unchanged or narrowed; blocks PR if new capabilities are introduced.

---

## Empirical Study: What 20 Popular Servers Actually Touch

We conducted an empirical investigation of 20 widely deployed MCP servers using `mcp-lock`. Key findings:
- **17 of 20** servers probe local filesystem directories outside their stated scope.
- **SSRF risks** in fetch tools allowing access to `169.254.169.254` and `localhost`.
- **Git hook execution** risks in `server-git` when inspecting untrusted repositories.

Read the full report: [docs/reports/POPULAR_MCP_SERVERS_REPORT.md](docs/reports/POPULAR_MCP_SERVERS_REPORT.md).

---

## Security Guarantees & Honest Claims

- **Never "Safe":** `mcp-lock` never claims that unobserved code paths are safe. It records facts: *no unapproved behavior was observed in the named scenarios with the stated instrumentation health*.
- **Incomplete != Clean:** Lost events or truncated traces yield `incomplete` (exit code 4), failing the gate.
- **Fail Closed:** If required sandbox capabilities or isolation features are unavailable, execution halts with exit code 5.
- **Tracer Boundary:** Contained `ptrace`/`strace` is suitable for development and CI assurance against benign/compromised regressions. Hostile red-team isolation requires out-of-target telemetry (eBPF or VM hypervisor).

---

## Project Documentation

- [Implementation Plan & Strategic Architecture](IMPLEMENTATION_PLAN.md)
- [Threat Model](docs/THREAT_MODEL.md)
- [Trust Badge Specification](docs/BADGE.md)
- [Empirical Study on 20 Popular MCP Servers](docs/reports/POPULAR_MCP_SERVERS_REPORT.md)
- [10-Maintainer Interview Guide & Outreach Kit](docs/MAINTAINER_INTERVIEWS.md)
- [Scope Architecture Decision Record](docs/ADR-0001-scope.md)

---

## License

`mcp-lock` is open-source software licensed under the [Apache License, Version 2.0](LICENSE).
