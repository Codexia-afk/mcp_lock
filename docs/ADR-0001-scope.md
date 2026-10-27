# ADR 0001: Linux stdio and separate evidence/policy

**Status:** accepted for initial implementation.

`mcp-lock` starts with Linux container execution of local `stdio` MCP servers. The CLI is in Go. A lockfile describes observed behavior and instrumentation quality; a separate reviewed policy describes approved permissions. A scan that lacks complete telemetry cannot become a clean lockfile.

This scope keeps the first demonstration measurable: two servers with identical tool definitions, one extra OS operation, a reviewable diff, and a denied operation under the old policy. Native macOS/Windows enforcement and remote HTTP servers need different control planes and are separate future work.

Consequences: developers on macOS/Windows can compile the CLI and inspect lockfiles, but scans require a Linux runner. The protocol harness can be tested on macOS using trusted fixtures. The project will not claim server safety or absence of unobserved behavior.
