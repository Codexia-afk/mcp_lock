# Contributing to mcp-lock

Thank you for your interest in contributing to `mcp-lock`! This project provides behavioral evidence, permission lockfiles, and author-side security tooling for the Model Context Protocol (MCP) ecosystem.

## Principles

1. **Honest Security Claims:** Never claim a server is "safe." Report what completed scenarios observed under verified trace health. Lost trace events mean `incomplete`, never clean.
2. **Author-First Convenience:** Keep friction low for maintainers. Support automated scenario generation, `npx`/`uvx` wrapping, and auto-approval of identical or narrower permissions.
3. **Fail Closed:** When required isolation or observation capabilities are unavailable, fail closed with explicit exit codes.
4. **Separation of Evidence and Enforcement:** Telemetry and observation are immutable evidence collection; enforcement is the OS sandbox boundary.

## Development Workflow

### Prerequisites
- Go 1.26 or later
- Docker with Linux container engine (e.g. Docker Desktop on macOS/Windows, or native Docker on Linux)

### Building and Testing
```sh
# Run all unit tests
go test -v ./...

# Build the CLI
go build -o bin/mcp-lock ./cmd/mcp-lock

# Run environment doctor
./bin/mcp-lock doctor

# Run end-to-end release gate fixture demonstration
./scripts/demo-two-version-gate.sh
```

### Pull Request Guidelines
- All code changes must include unit and integration tests.
- Maintain documentation integrity and format all markdown files cleanly.
- Keep dependency additions minimal; prefer standard library where possible.
