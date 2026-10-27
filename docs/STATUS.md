# Implementation Status

Last updated: October 27, 2026.

| Plan Gate | Status | Evidence / Verification |
| :--- | :--- | :--- |
| **1. Threat model, scope, schemas** | Complete | `THREAT_MODEL.md`, ADR 0001, versioned JSON Schemas validated via `internal/lockfile` tests. |
| **2. MCP protocol harness** | Complete | Modern `2026-07-28` discovery and legacy `2025-11-25` handshake supported with verified `mcpclient` tests. |
| **3. Auto-generated scenarios** | Complete | `internal/scenariogen` synthesizes safe starter scenarios from `tools/list` schemas; `mcp-lock init` and `scenario generate` commands live. |
| **4. Target packaging (npx / uvx)** | Complete | `internal/wrap` compiles `npx` and `uvx` invocations into pinned containers with non-root UID `65532:65532`; `mcp-lock wrap` and transparent `observe -- npx ...` live. |
| **5. OS observation & normalization** | Complete | `internal/observer` and `internal/normalize` capture raw syscalls (`openat`, `creat`, `connect`, `execve`), normalize paths, calculate `evidenceDigest`, and check trace health (`docker-strace-linux-v1`, `emulated-tracer-v1`). |
| **6. Canonical behavior.lock** | Complete | `mcp-lock observe` emits canonical, validated `behavior.lock` files adhering strictly to `behavior-lock.v1.schema.json`. |
| **7. Semantic diff & auto-approval** | Complete | `mcp-lock diff --auto-approve-narrower` approves updates with identical or narrower permissions; flags additions with exit code 2. |
| **8. Release Gate Proof** | Complete & Passing | `scripts/demo-two-version-gate.sh` builds baseline and changed images with identical MCP interfaces: diff catches secret read; candidate assessment blocks it with exit code 2; baseline passes with exit code 0. |
| **9. Author-Side Wedge Deliverables** | Complete | Turnkey GitHub Action (`.github/actions/mcp-lock`), Trust Badge generator (`mcp-lock badge`), Empirical 20-server report (`POPULAR_MCP_SERVERS_REPORT.md`), and 10-maintainer interview kit (`MAINTAINER_INTERVIEWS.md`). |
| **10. Open-Source Governance** | Complete | Apache 2.0 `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and GitHub CI workflow (`.github/workflows/ci.yml`). |
| **11. Policy Enforcement (Phase 7)** | Next Milestone | Runtime Landlock sandbox and constrained network proxy (to be scheduled following maintainer demand validation in week 5–6). |

All unit tests (`go test -v ./...`) and end-to-end integration tests (`test/integration/release_gate_test.go`) pass on macOS/arm64 with Docker Desktop Linux VM engine (Docker 29.8.2 / `linuxkit`).
