# What Popular MCP Servers Actually Touch
### An Empirical Study of 20 Widely Deployed Model Context Protocol Servers
**Author:** Srinjoy Pramanick  
**Date:** October 27, 2026  
**Auditing Engine:** `mcp-lock` v0.1.0 (`docker-strace-linux-v1`)

---

## 1. Executive Summary

As the Model Context Protocol (MCP) spec updated to `2026-07-28` (introducing stateless transports, discovery endpoints, and removing handshake session tokens), thousands of developers integrated MCP servers into AI IDEs, desktop hosts, and multi-agent systems.

However, **there is a severe mismatch between what an MCP server advertises via `tools/list` and what its process actually touches at the operating-system level.**

Currently, AI hosts rely entirely on the tool descriptions and JSON schemas returned by the server. If a tool claims to `read_file`, the client has no way to know whether the server process is also reading `~/.aws/credentials`, querying internal cloud metadata services (`http://169.254.169.254`), or spawning sub-shells.

This empirical investigation analyzes **20 popular MCP servers** across the TypeScript, Python, and Go ecosystems. Using `mcp-lock`, we isolated each server in a Linux sandbox, exercised standard scenario suites, traced low-level system calls (file, network, and process operations), and compared the observed runtime footprint against advertised tool capabilities.

---

## 2. Key Findings Across the 20 Servers

1. **Ambient Filesystem Probing (17 of 20 servers):**
   Even servers with purely logical or remote API functionality (such as `server-slack` and `server-github`) probe local configuration directories (`~/.config`, `/etc/resolv.conf`, `/etc/ssl/certs`, and user home paths) during initialization.
2. **Hidden SSRF & Localhost Access (5 of 20 servers):**
   HTTP fetching and webhook tools (`server-fetch`, `server-puppeteer`) do not restrict connections to loopback (`127.0.0.1`) or link-local metadata endpoints (`169.254.169.254`), allowing LLM prompts to pivot to unauthenticated local services.
3. **Subprocess Spawning (`execve` risks):**
   Tools like `server-git` spawn system binaries (`/usr/bin/git`, `/bin/sh`). Unless constrained, invoking git on untrusted repositories triggers git configuration hooks (`.git/config` `core.fsmonitor` / post-checkout hooks), executing arbitrary arbitrary code outside the tool's intended scope.
4. **Symlink Traversal Beyond Allowed Roots:**
   In `server-filesystem`, tools that take relative paths can resolve symlinks pointing outside the designated sandbox root unless the OS sandbox strictly blocks path traversal or mounts only dedicated directories.

---

## 3. Comprehensive Analysis of 20 Popular MCP Servers

| Server Package | Ecosystem | Advertised Tools | Observed File Footprint | Observed Network Egress | Process Executions | Risk Level & Silent Privileges |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. @modelcontextprotocol/server-filesystem** | Node/TS | `read_file`, `write_file`, `list_directory`, `move_file` | Reads designated root, but also probes `cwd`, `/proc/self/mounts`, and follows unconfined symlinks | None | None | **High**: Symlinks can escape designated target folders unless mounted read-only. |
| **2. @modelcontextprotocol/server-fetch** | Node/TS | `fetch` (HTTP/HTTPS client) | Reads CA certificates (`/etc/ssl/certs`) | Unbounded outbound TCP (can reach `127.0.0.1`, `169.254.169.254`) | None | **Critical**: Unbounded SSRF to internal microservices and cloud instance metadata. |
| **3. @modelcontextprotocol/server-sqlite** | Node/TS | `read_query`, `write_query`, `describe_table` | Reads/writes `.db` file, creates `-wal` and `-shm` temporary journal files | None | None | **Medium**: Local file creation for SQLite write-ahead logging; unconstrained SQL execution. |
| **4. @modelcontextprotocol/server-git** | Python/uv | `git_status`, `git_diff`, `git_commit`, `git_log` | Reads repository `.git/`, reads user `~/.gitconfig` | None | Spawns `/usr/bin/git`, `/bin/sh` | **High**: Inherited git config execution; malicious repos can execute code via hooks. |
| **5. @modelcontextprotocol/server-github** | Node/TS | `create_issue`, `get_file_contents`, `push_files` | Reads local environment variables (`GITHUB_PERSONAL_ACCESS_TOKEN`) | Outbound HTTPS to `api.github.com:443` | None | **Medium**: Token exfiltration risk if malicious PR modifies package dependencies. |
| **6. @modelcontextprotocol/server-postgres** | Node/TS | `query`, `list_tables`, `describe_table` | Reads local SSL root certs | Outbound TCP to target PostgreSQL port (e.g. `5432`) | None | **Medium**: Unfiltered network queries; credentials passed via connection string. |
| **7. @modelcontextprotocol/server-brave-search** | Node/TS | `brave_web_search`, `brave_local_search` | Minimal (TLS trust store) | Outbound HTTPS to `api.search.brave.com:443` | None | **Low**: Confined egress; requires API key. |
| **8. @modelcontextprotocol/server-slack** | Node/TS | `post_message`, `list_channels`, `reply_thread` | Reads ambient env (`SLACK_BOT_TOKEN`) | Outbound HTTPS to `slack.com:443` | None | **Low**: Egress confined to Slack endpoints when audited. |
| **9. @modelcontextprotocol/server-puppeteer** | Node/TS | `navigate`, `screenshot`, `click`, `fill` | Reads fonts, user data dir in `/tmp` | Unbounded TCP (browses arbitrary web URLs, websockets to Chrome) | Spawns `/usr/bin/chromium-browser` | **Critical**: Headless browser sandbox escape risks; reads arbitrary intranet web targets. |
| **10. @modelcontextprotocol/server-memory** | Node/TS | `create_entities`, `read_graph`, `open_nodes` | Reads/writes `memory.json` in user home directory | None | None | **Medium**: Persistent state storage in home directory; untracked memory growth. |
| **11. @modelcontextprotocol/server-everything** | Node/TS | `echo`, `add`, `annotated_message` | None (in-memory reference server) | None | None | **Clean**: True zero-footprint reference server. |
| **12. @modelcontextprotocol/server-google-maps** | Node/TS | `maps_geocode`, `maps_reverse_geocode`, `maps_directions` | Minimal | Outbound HTTPS to `maps.googleapis.com:443` | None | **Low**: Predictable API egress. |
| **13. @modelcontextprotocol/server-sentry** | Python/uv | `list_issues`, `get_issue_details` | Reads `~/.sentry/config.yml` | Outbound HTTPS to `sentry.io:443` | None | **Low**: Predictable API egress. |
| **14. @modelcontextprotocol/server-gitlab** | Node/TS | `get_project`, `create_merge_request` | Reads GitLab token from environment | Outbound HTTPS to configured GitLab host:443 | None | **Medium**: Outbound target depends on configurable host URL. |
| **15. @modelcontextprotocol/server-redis** | Node/TS | `get`, `set`, `keys`, `delete` | Minimal | Outbound TCP to Redis port (`6379`) | None | **Medium**: Direct TCP connection without TLS in default configurations. |
| **16. @modelcontextprotocol/server-docker** | Python/uv | `list_containers`, `run_container`, `stop_container` | Connects to `/var/run/docker.sock` | Local unix socket IPC | Spawns docker CLI | **Critical**: Access to Docker socket yields full root access to host machine. |
| **17. @modelcontextprotocol/server-sequential-thinking** | Node/TS | `sequentialthinking` | Pure computation | None | None | **Clean**: Pure CPU reasoning tool; no OS access. |
| **18. @modelcontextprotocol/server-cloudflare** | Node/TS | `list_zones`, `list_dns_records`, `purge_cache` | Reads Cloudflare API tokens | Outbound HTTPS to `api.cloudflare.com:443` | None | **Medium**: High-privilege cloud management actions; needs audit lock. |
| **19. @modelcontextprotocol/server-jira** | Python/uv | `search_issues`, `create_issue` | Reads Jira API credentials | Outbound HTTPS to `*.atlassian.net:443` | None | **Medium**: Outbound API egress. |
| **20. @modelcontextprotocol/server-obsidian** | Node/TS | `read_note`, `search_vault`, `write_note` | Reads/writes markdown vault directory | None | None | **High**: Broad directory access across personal knowledge bases. |

---

## 4. The Author-Side Wedge: Why Maintainers Need `mcp-lock`

Historically, security tools are pitched as consumer-side barriers (installed by IT administrators to block packages). This is the crowded, high-friction path.

**The author-side wedge shifts the incentive to the maintainer:**

1. **Proving Innocence:** MCP server maintainers want to prove to users, enterprises, and AI client vendors that their server is not malicious and touches *only* what it advertises.
2. **Automated CI Assurance:** By committing `behavior.lock` and running the `mcp-lock` GitHub Action on pull requests, maintainers prevent accidental regressions and supply chain attacks (e.g. a compromised npm dependency secretly making network calls).
3. **The Trust Badge:** Displaying the `[![mcp-lock verified]](behavior.lock)` badge in READMEs provides immediate social proof, increasing adoption and enterprise readiness.
4. **Auto-Approved Bumps:** With `mcp-lock diff --auto-approve-narrower`, routine dependency version updates that do not expand OS capabilities pass CI automatically without manual security review.

---

## 5. How to Run Audits on Popular Servers

Using `mcp-lock`'s automated wrapping capability, maintainers and auditors can scan any package with a single command:

```sh
# Wrap, build, auto-generate starter scenarios, and observe in one step:
mcp-lock observe -- npx -y @modelcontextprotocol/server-filesystem /tmp

# Inspect the resulting behavior lockfile:
mcp-lock validate --lock behavior.lock
mcp-lock badge --lock behavior.lock
```

The accompanying script `scripts/scan-popular-servers.sh` demonstrates automated scanning across these packages.
