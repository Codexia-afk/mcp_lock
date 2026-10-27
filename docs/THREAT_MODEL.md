# Threat model (draft, version 1)

## Protected assets

Host files and credentials, network access, Docker daemon socket, integrity of observed evidence, and approved policy. The first implementation targets local `stdio` MCP servers in Linux containers.

## Trust boundaries

- Untrusted: MCP server image and output, package build scripts, scenario-controlled data, paths and hostnames received from the target.
- Trusted: CLI, container runtime on the runner, observer, normalizer, policy compiler and network proxy. The policy reviewer is a human using source control review.
- An image build is execution of untrusted code. For hostile packages, both build and scan belong on a disposable Linux VM or runner with no real secrets.
- Docker containers share a kernel with the runner. The container boundary alone is not a guarantee against a malicious kernel exploit.

## Attacker goals and required controls

| Goal | Required defense | Failure behavior |
| --- | --- | --- |
| Read host files | No sensitive bind mounts; non-root target; read-only minimal filesystem; reviewed file grants | Deny; report attempt |
| Exfiltrate data | Network disabled by default; future constrained proxy; no real secrets in scans | Deny; report attempt |
| Hide behavior from trace | Observer outside target control; loss detection; process-tree coverage | Mark scan incomplete |
| Exhaust runner | CPU, memory, PID, disk, output and time limits | Terminate scan; mark incomplete |
| Poison a lockfile | Pin image, scenarios and runner; review first evidence separately from policy | Refuse approval or comparison |
| Abuse CI | Isolated runner, read-only token, no deployment secrets, pinned actions | Fail CI; investigate |

## Current implementation boundary

The `scenario check` command only verifies MCP responses inside a network-denied container. It does not observe filesystem/process/network operations. The `observe`, `verify` and `run` commands intentionally refuse execution until an observer and enforcement controls are implemented and tested. Lockfile validation and diffing are offline operations on supplied evidence; a structurally valid lockfile is not a security attestation.

## Claims to verify before beta

1. The observer follows all descendants and reports loss or tampering.
2. The normalizer maps file access to the correct path after `cwd`, `dirfd`, symlink and rename operations.
3. Direct network egress remains blocked when domain proxy rules are enabled.
4. The runtime wrapper fails closed when any required control is unavailable.
5. A changed fixture with identical MCP interface yields an added operation and an enforced denial.
