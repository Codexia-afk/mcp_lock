# Security Policy

## Supported Versions

| Version | Supported |
| :--- | :--- |
| `0.1.x` | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability, sandbox escape, trace evasion, or policy bypass in `mcp-lock`, please report it privately.

**Do NOT file public GitHub issues for security vulnerabilities.**

Send reports via email to the security team with:
- Target version and environment (`docker info`, kernel version, architecture)
- Proof of concept demonstrating the unexpected permission grant, trace omission, or bypass
- Expected vs observed behavior

We will respond within 48 hours to acknowledge receipt and coordinate a patch release.

## Honest Limitations

- **No Absolutes:** `mcp-lock` reports *what was observed during executed scenarios*. It cannot prove that unexercised code paths contain no unobserved actions.
- **Fail Closed:** If a tracer drops events, or required kernel enforcement features are missing, `mcp-lock` exits with an error (`4` or `5`).
- **Tracer Independence:** The contained `ptrace`/`strace` backend is labeled best-effort. In hostile environments, kernel-level eBPF or VM-level out-of-target telemetry is required.
