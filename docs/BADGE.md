# mcp-lock Trust Badge Specification

The `mcp-lock` badge provides cryptographic, reproducible proof that an MCP server operates within reviewed behavioral bounds. Maintainers display this badge in their repository README to assure consumers and AI agents that the server has undergone automated OS-level behavioral auditing.

## Badge Appearance

```markdown
[![mcp-lock: verified behavior](https://img.shields.io/badge/mcp--lock-verified_behavior-2ea44f?logo=shield)](behavior.lock)
```

[![mcp-lock: verified behavior](https://img.shields.io/badge/mcp--lock-verified_behavior-2ea44f?logo=shield)](file:///Users/srinjoypramanick/mcp%20lock/behavior.lock)

## Verification Tiers

| Tier | Color | Meaning |
| :--- | :--- | :--- |
| **Verified Clean** | Green (`2ea44f`) | Scenarios completed with 0 lost trace events. Zero network egress observed, all file access confined to explicit read-only fixture mounts. |
| **Audited Egress** | Blue (`0969da`) | Outbound network connections observed, but strictly constrained to reviewer-approved external API domains via proxy. |
| **Identity Updated** | Purple (`8250df`) | Server code digest bumped with identical or strictly narrower OS capabilities (auto-approved via `mcp-lock diff --auto-approve-narrower`). |
| **Review Required** | Amber/Red (`d1242f`) | Unreviewed behavioral expansion detected (e.g., unexpected outbound socket or unapproved file path read). |

## How Maintainers Add the Badge

### 1. Generate the Badge Snippet
Run the `badge` command against your committed `behavior.lock`:

```sh
mcp-lock badge --lock behavior.lock
```

Output:
```markdown
[![mcp-lock: verified behavior](https://img.shields.io/badge/mcp--lock-verified_behavior-2ea44f?logo=shield)](behavior.lock)

### Audited MCP Server Behavior
- **Status**: Verified complete (`docker-strace-linux-v1`)
- **Scenarios**: 4/4 passed
- **Observed Filesystem Reads**: 2
- **Observed Filesystem Writes**: 0
- **Observed Network Egress**: 0
- **Observed Subprocesses**: 1
- **Evidence Digest**: `sha256:...`
```

### 2. Paste into your README.md
Paste the snippet at the top of your repository's `README.md`. When consumers or AI client gateways inspect your repository, they can click directly on the badge to inspect the immutable evidence in `behavior.lock`.

### 3. Automate Badge Updates with GitHub Actions
Add the `mcp-lock` GitHub Action to `.github/workflows/audit.yml` to automatically verify every pull request and generate updated badge status tables.
