import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  Layers,
  FileSearch,
  FileCheck,
  GitCompare,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Terminal } from "@/components/icons/brand-icons";

export const metadata: Metadata = {
  title: "How It Works — mcp-lock",
  description:
    "The 8-step technical lifecycle of mcp-lock: from zero-friction packaging, container sandboxing, and MCP protocol handshake to syscall observation, normalization, and release-gate diffing.",
};

const LIFECYCLE_STEPS = [
  {
    step: "01",
    title: "Zero-Friction Packaging & Auto-Wrapping",
    icon: Package,
    summary: "Wrap any published package without manual Dockerfiles.",
    detail:
      "When given `npx -y @pkg` or `uvx mcp-server-git`, mcp-lock's wrap engine generates a minimal, pinned OCI image configured with non-root UID 65532:65532 and reproducible metadata.",
    command: "$ mcp-lock observe -- npx -y @modelcontextprotocol/server-filesystem /tmp",
  },
  {
    step: "02",
    title: "Disposable Sandbox Container Creation",
    icon: Layers,
    summary: "Execute in a hardened, contained Linux environment.",
    detail:
      "The container executes with dropped Linux capabilities, network isolation (unless network testing is explicitly configured), and read-only root filesystems. Memory and process limits prevent denial-of-service.",
    command: "docker run --rm --cap-drop=ALL --user 65532:65532 ...",
  },
  {
    step: "03",
    title: "Dual Protocol Discovery Handshake",
    icon: Terminal,
    summary: "Supports modern stateless discover and legacy initialize.",
    detail:
      "mcp-lock communicates over stdio using JSON-RPC 2.0. It tries modern stateless MCP (2026-07-28 `server/discover`) first, gracefully falling back to legacy handshake (2025-11-25 `initialize`).",
    command: '{"jsonrpc":"2.0","id":1,"method":"server/discover"}',
  },
  {
    step: "04",
    title: "Scenario Execution & Safe Synthesis",
    icon: FileSearch,
    summary: "Synthesizes type-safe, non-destructive test inputs.",
    detail:
      "The scenario runner invokes MCP tools sequentially. Inputs are synthesized automatically from `tools/list` JSON schemas (`mcp-lock scenario generate`) or loaded from `mcp-lock.json` configurations.",
    command: "$ mcp-lock scenario generate --config mcp-lock.json",
  },
  {
    step: "05",
    title: "Low-Level Syscall Interception (strace)",
    icon: ShieldAlert,
    summary: "Contained Linux observer capturing OS operations.",
    detail:
      "The `docker-strace-linux-v1` backend attaches to the target process group, tracing `openat`, `creat`, `connect`, and `execve`. Telemetry drop counters ensure trace health; any lost events fail the gate.",
    command: "docker-strace-linux-v1 attached: 0 lost events",
  },
  {
    step: "06",
    title: "Trace Normalization & Evidence Digest",
    icon: FileCheck,
    summary: "Canonicalizes paths and hashes observations.",
    detail:
      "Raw paths are cleaned (resolving `..`, filtering `/proc/self` runtime noise). The resulting observation set is sorted deterministically and hashed alongside server image and suite digests to produce `evidenceDigest`.",
    command: 'evidenceDigest: "sha256:7b1e4c9a8d2e5f3..."',
  },
  {
    step: "07",
    title: "Semantic Capability Diffing",
    icon: GitCompare,
    summary: "Distinguishes added versus removed OS capabilities.",
    detail:
      "Compares candidate `behavior.lock` against baseline. If an update removes an unused socket connection, `--auto-approve-narrower` approves it automatically. If a new file read is detected, exit code 2 is returned.",
    command: "$ mcp-lock diff --from base.lock --to cand.lock --auto-approve-narrower",
  },
  {
    step: "08",
    title: "Policy Assessment & CI Gate",
    icon: ShieldCheck,
    summary: "Automated release gates in GitHub Actions.",
    detail:
      "Assesses candidate observations against an approved policy file (`mcp-lock policy assess`). Returns exit code 0 for compliance, 2 for unapproved operations, 4 for incomplete evidence, and 5 for sandbox failures.",
    command: "$ mcp-lock policy assess --policy policy.json --lock cand.lock",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Technical Architecture</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          How mcp-lock works
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
          Similar to a package lockfile that pins dependency versions, mcp-lock pins operating system runtime behavior.
          Here is the step-by-step lifecycle from invocation to CI gate.
        </p>
      </div>

      {/* Architecture Overview Flowchart */}
      <section className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight">The 8-Step Verification Pipeline</h2>
        <p className="mt-1 text-sm text-muted">From server discovery to policy assessment and pull request gates.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-inset/40 p-4">
            <span className="font-mono text-xs font-bold text-primary">1. Packaging</span>
            <p className="mt-1 font-semibold text-sm">Target Server</p>
            <p className="mt-1 text-xs text-muted">npx, uvx, or pre-built container image</p>
          </div>
          <div className="rounded-xl border border-line bg-inset/40 p-4">
            <span className="font-mono text-xs font-bold text-primary">2. Sandbox</span>
            <p className="mt-1 font-semibold text-sm">Linux Container</p>
            <p className="mt-1 text-xs text-muted">UID 65532, dropped caps, network isolated</p>
          </div>
          <div className="rounded-xl border border-line bg-inset/40 p-4">
            <span className="font-mono text-xs font-bold text-primary">3. Tracer</span>
            <p className="mt-1 font-semibold text-sm">docker-strace</p>
            <p className="mt-1 text-xs text-muted">Captures openat, connect, execve</p>
          </div>
          <div className="rounded-xl border border-line bg-inset/40 p-4">
            <span className="font-mono text-xs font-bold text-primary">4. Canonical Gate</span>
            <p className="mt-1 font-semibold text-sm">behavior.lock</p>
            <p className="mt-1 text-xs text-muted">Versioned digest, diff & policy evaluation</p>
          </div>
        </div>
      </section>

      {/* Detailed Lifecycle Steps */}
      <section className="space-y-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Detailed Lifecycle Walkthrough</h2>
          <p className="mt-2 text-muted">Every phase is deterministic, audited, and adheres to strict schema validation.</p>
        </div>

        <div className="space-y-6">
          {LIFECYCLE_STEPS.map((step) => (
            <div
              key={step.step}
              className="grid gap-6 rounded-2xl border border-line bg-surface p-6 shadow-sm lg:grid-cols-[1.4fr_1.1fr] lg:items-center"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-inset font-mono text-xs font-bold text-primary">
                    {step.step}
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-4" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
                </div>
                <p className="mt-3 font-semibold text-sm text-ink">{step.summary}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.detail}</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-line bg-[#0c1017] p-4 font-mono text-xs text-[#dbe4ee]">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px] text-white/40">
                  <span>console</span>
                  <span>stdio</span>
                </div>
                <div className="mt-3 overflow-x-auto text-signal">
                  {step.command}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Honest Limitations Box */}
      <section className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">Honest Technical Boundaries</h3>
            <p className="text-sm text-muted">What behavioral observation can and cannot guarantee.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm text-muted">
          <div className="rounded-xl border border-line bg-inset/30 p-5">
            <p className="font-semibold text-ink">Dynamic Coverage Limits</p>
            <p className="mt-2 text-xs leading-relaxed">
              mcp-lock only observes execution paths triggered by the test scenarios. Logic bombs activated by specific prompt payloads or calendar dates cannot be observed without matching scenarios.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-inset/30 p-5">
            <p className="font-semibold text-ink">Incomplete != Clean</p>
            <p className="mt-2 text-xs leading-relaxed">
              If the ptrace buffer drops events or the server aborts prematurely, mcp-lock exits with code 4. We never pretend dropped telemetry is clean.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-inset/30 p-5">
            <p className="font-semibold text-ink">Sandbox Isolation Boundary</p>
            <p className="mt-2 text-xs leading-relaxed">
              Contained Linux strace is designed for maintainers and CI assurance. Malicious kernel zero-days require hypervisor or out-of-band eBPF hardware boundaries.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
        <Link href="/install" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
          Install the CLI on macOS, Linux, or Windows &rarr;
        </Link>
        <Link href="/docs/first-scan" className="text-sm font-semibold text-muted hover:text-ink">
          Follow the first scan tutorial &rarr;
        </Link>
      </div>
    </div>
  );
}
