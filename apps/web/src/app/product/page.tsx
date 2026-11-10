import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Eye,
  FileLock2,
  GitCompare,
  Cpu,
  Workflow,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Product — mcp-lock",
  description:
    "The mcp-lock developer security platform: behavioral observation, behavioral lockfiles, capability drift detection, policies, and CI integration.",
};

const AUDIENCES = [
  {
    role: "For AI Engineers & Developers",
    tagline: "Know what your tools touch before deploying to production.",
    description:
      "When integrating community MCP servers into Claude Desktop, Cursor, or proprietary AI agents, you can no longer afford to treat tool processes as black boxes. mcp-lock traces exact filesystem paths, network destinations, and subprocess invocations during execution.",
    bullets: [
      "Zero-friction wrapper for npx and uvx invocations",
      "Human-readable behavior.lock inspectable in code reviews",
      "Immediate detection of hidden background tasks or socket binds",
    ],
  },
  {
    role: "For MCP Server Authors & Maintainers",
    tagline: "Cryptographically prove your innocence and prevent supply chain backdoors.",
    description:
      "Instead of fielding defensive questions from enterprise security auditors, maintainers can run mcp-lock in CI. Automatically fail pull requests that expand OS capabilities, and embed a verified trust badge in your README.",
    bullets: [
      "Auto-approve routine bumps with --auto-approve-narrower",
      "Turnkey GitHub Action for automated pull request auditing",
      "Maintainer badge backed by SHA-256 evidence digests",
    ],
  },
  {
    role: "For AppSec & Infrastructure Teams",
    tagline: "Enforce least-privilege policies across the entire agent supply chain.",
    description:
      "Define approved baseline policies for AI tool servers. Assess candidate lockfiles against organization policies, catch SSRF attempts to cloud metadata endpoints (169.254.169.254), and maintain an inventory of all active MCP server behaviors.",
    bullets: [
      "Policy propose & assess workflows with fail-closed exits",
      "Centralized workspace to track server inventories and scans",
      "Automated release gates blocking unapproved file reads",
    ],
  },
];

const PLATFORM_PILLARS = [
  {
    icon: Eye,
    title: "1. Controlled Behavioral Sandbox",
    description:
      "mcp-lock executes target servers in disposable, non-root Linux containers (UID 65532) with dropped capabilities and ptrace instrumentation. Low-level syscalls (openat, creat, connect, execve) are traced and normalized.",
  },
  {
    icon: FileLock2,
    title: "2. The Behavioral Lockfile (v1)",
    description:
      "Similar to package-lock.json or Cargo.lock, behavior.lock records facts: normalized filesystem paths, network host/port targets, executable digests, scenario coverage, and observer telemetry health.",
  },
  {
    icon: GitCompare,
    title: "3. Semantic Capability Diffing",
    description:
      "Diffs candidate against baseline lockfiles. Detects added vs removed capabilities. If a dependency update removes an unused socket call, --auto-approve-narrower passes cleanly while new file reads fail CI.",
  },
  {
    icon: ShieldCheck,
    title: "4. Policy Generation & Release Gates",
    description:
      "Synthesize security policies from baseline evidence. Assess new builds in GitHub Actions or CI runners. When unapproved operations occur, mcp-lock halts execution with exit code 2.",
  },
];

export default function ProductPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Platform Overview</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          The behavioral security platform for Model Context Protocol.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
          mcp-lock brings deterministic, reproducible operating-system behavioral verification to MCP servers.
          Built maintainer-first, developer-friendly, and enterprise-grade.
        </p>
      </div>

      {/* Three Audiences */}
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Tailored for every role in the AI tool chain</h2>
          <p className="mt-2 text-muted">A cohesive platform serving developers, maintainers, and security teams.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {AUDIENCES.map((aud, i) => (
            <div key={i} className="flex flex-col rounded-2xl border border-line bg-surface p-8 shadow-sm">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">{aud.role}</span>
              <h3 className="mt-3 text-xl font-bold tracking-tight">{aud.tagline}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{aud.description}</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-muted">
                {aud.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="rounded-2xl border border-line bg-surface/50 p-8 sm:p-12">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Core Architecture</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Four pillars of behavioral verification</h2>
          <p className="mt-3 text-muted">
            Engineered around verifiable facts rather than heuristic predictions or static prompt scans.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_PILLARS.map((p, i) => (
            <div key={i} className="rounded-xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-inset text-primary">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Why behavioral observation surpasses static analysis</h2>
          <p className="mt-2 text-muted">Comparing mcp-lock against traditional approaches to MCP server security.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-inset/50 font-mono text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-6 py-4">Capability</th>
                <th className="px-6 py-4">Tool JSON Schemas</th>
                <th className="px-6 py-4">Static Code Scanners</th>
                <th className="px-6 py-4 text-primary">mcp-lock Behavioral Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="px-6 py-4 font-semibold text-ink">Catches hidden file reads</td>
                <td className="px-6 py-4 text-critical font-mono text-xs">No (Interface only)</td>
                <td className="px-6 py-4 text-muted font-mono text-xs">False positive prone</td>
                <td className="px-6 py-4 text-signal font-mono text-xs font-bold">Yes (Exact syscall trace)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-ink">Detects runtime SSRF / IMDS calls</td>
                <td className="px-6 py-4 text-critical font-mono text-xs">No</td>
                <td className="px-6 py-4 text-muted font-mono text-xs">Blind to dynamic URLs</td>
                <td className="px-6 py-4 text-signal font-mono text-xs font-bold">Yes (connect() captured)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-ink">Supply chain dependency changes</td>
                <td className="px-6 py-4 text-critical font-mono text-xs">Ignored</td>
                <td className="px-6 py-4 text-muted font-mono text-xs">Limited to known CVEs</td>
                <td className="px-6 py-4 text-signal font-mono text-xs font-bold">Yes (Diff flags drift)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-ink">Auto-approve narrower updates</td>
                <td className="px-6 py-4 text-muted font-mono text-xs">N/A</td>
                <td className="px-6 py-4 text-muted font-mono text-xs">No</td>
                <td className="px-6 py-4 text-signal font-mono text-xs font-bold">Yes (--auto-approve-narrower)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-ink">Maintainer README trust badge</td>
                <td className="px-6 py-4 text-muted font-mono text-xs">N/A</td>
                <td className="px-6 py-4 text-muted font-mono text-xs">No</td>
                <td className="px-6 py-4 text-signal font-mono text-xs font-bold">Yes (Cryptographic digest)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-line bg-inset/40 p-10 text-center sm:flex-row sm:text-left">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Ready to verify your first MCP server?</h3>
          <p className="mt-1 text-sm text-muted">Install the open-source CLI or explore the developer dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/install"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow hover:bg-primary-hover"
          >
            Install CLI <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/app"
            className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-6 text-sm font-semibold text-ink shadow-sm hover:bg-inset"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
