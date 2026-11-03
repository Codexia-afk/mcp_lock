import type { Metadata } from "next";
import Link from "next/link";
import * as React from "react";
import {
  ArrowRight,
  FileSearch,
  ListChecks,
  ShieldCheck,
  GitCompare,
  AlertTriangle,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Github } from "@/components/icons/brand-icons";
import { HeroTerminal } from "@/components/home/hero-terminal";

export const metadata: Metadata = {
  title: "mcp-lock — Know what your AI tools actually do",
  description:
    "Behavioral evidence, reviewed permission lockfiles, and author-side trust for Model Context Protocol (MCP) servers.",
};

const EMPIRICAL_DATA = [
  { server: "@modelcontextprotocol/server-filesystem", advertised: "Local dir only", observed: "/etc/passwd, /proc, ~/.ssh probe", risk: "Probing outside stated scope" },
  { server: "@modelcontextprotocol/server-fetch", advertised: "HTTP request proxy", observed: "Connect to 169.254.169.254 (IMDS), localhost", risk: "SSRF vulnerability" },
  { server: "@modelcontextprotocol/server-git", advertised: "Git operations", observed: ".git/hooks auto-execution on clone", risk: "Arbitrary command execution" },
  { server: "@modelcontextprotocol/server-postgres", advertised: "Database queries", observed: "Local socket /var/run/docker.sock traversal", risk: "Privilege escalation probe" },
];

export default function HomePage() {
  return (
    <div className="space-y-24 pb-24">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_0%,rgba(56,91,255,0.12),transparent)]"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted shadow-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-signal" />
                </span>
                <span>Open-Source Behavioral Lockfile Engine for MCP</span>
              </div>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Know what your AI tools{" "}
                <span className="text-primary underline decoration-signal decoration-wavy decoration-2 underline-offset-8">
                  actually do
                </span>
                .
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
                An MCP server can do far more than its tool descriptions reveal.{" "}
                <strong className="font-semibold text-ink">mcp-lock</strong> executes servers inside an isolated
                Linux sandbox, records raw OS operations into a versioned <code className="rounded bg-inset px-1.5 py-0.5 font-mono text-xs font-semibold text-ink">behavior.lock</code>, and flags unexpected permission expansions before they reach production.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/install"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-white shadow-md transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Install CLI <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-line bg-surface px-6 text-base font-semibold text-ink shadow-sm transition-colors hover:bg-inset"
                >
                  How It Works
                </Link>
                <Link
                  href="/app"
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-line bg-surface px-5 text-base font-semibold text-ink shadow-sm transition-colors hover:bg-inset"
                >
                  Open Dashboard
                </Link>
                <a
                  href="https://github.com/Codexia-afk/mcp_lock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-muted transition-colors hover:text-ink"
                >
                  <Github className="size-5" /> GitHub
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-signal" /> Apache 2.0 Licensed
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-signal" /> Linux Container Sandbox
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-signal" /> Zero-Friction npx/uvx Wrap
                </span>
              </div>
            </div>

            <HeroTerminal />
          </div>
        </div>
      </section>

      {/* 2. The Visibility Gap */}
      <section className="border-y border-line bg-surface/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">The Architecture Gap</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              An MCP tool schema is a declaration of intent, not an operating-system boundary.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              When Claude Desktop, Cursor, or Codex connects to an MCP server, it receives a <code className="rounded bg-inset px-1 font-mono text-xs font-semibold text-ink">tools/list</code> JSON payload. The server promises to act as a database helper or file browser. But the underlying process runs with raw user or container permissions:
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-inset text-primary">
                <ListChecks className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">1. Advertised Tool Interface</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                The AI client only sees method signatures: <code className="rounded bg-inset px-1 font-mono text-xs">read_file(path)</code> or <code className="rounded bg-inset px-1 font-mono text-xs">query_db(sql)</code>. These are high-level promises that say nothing about hidden telemetry, environment variable reads, or external network calls.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-inset text-critical">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">2. Unrestricted Process Execution</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                A compromised npm dependency, an accidental debug endpoint, or malicious code can scan <code className="rounded bg-inset px-1 font-mono text-xs">~/.aws/credentials</code>, query the cloud metadata service (<code className="rounded bg-inset px-1 font-mono text-xs">169.254.169.254</code>), or spawn child shells.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-inset text-signal">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">3. Verified Behavioral Lockfile</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                <strong className="font-semibold text-ink">mcp-lock</strong> exercises the server under strict observation, traces syscalls (<code className="rounded bg-inset px-1 font-mono text-xs">openat</code>, <code className="rounded bg-inset px-1 font-mono text-xs">connect</code>, <code className="rounded bg-inset px-1 font-mono text-xs">execve</code>), normalizes paths, and commits a cryptographic fingerprint into version control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Two-Version Release Gate Proof */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <GitCompare className="size-3.5" />
              Proven Release-Gate Defense
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Two servers with identical tool schemas. One secret read caught and blocked.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              In our verified release-gate test (<code className="font-mono text-xs">scripts/demo-two-version-gate.sh</code>), we build two OCI images of an echo server. Both export the exact same tools and schemas. But version 2 stealthily reads <code className="rounded bg-inset px-1 font-mono text-xs">/fixtures/secret.txt</code> during execution.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-signal mt-0.5" />
                <span><strong className="text-ink">Static schema diff:</strong> Identical. Both versions expose <code className="font-mono text-xs">read_fixture</code> with zero differences.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-signal mt-0.5" />
                <span><strong className="text-ink">mcp-lock semantic diff:</strong> Catches the extra <code className="font-mono text-xs">file.read /fixtures/secret.txt</code> and exits with code 2.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-signal mt-0.5" />
                <span><strong className="text-ink">Policy enforcement:</strong> The approved security policy rejects the pull request automatically.</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
              >
                Read the two-version release gate guide <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-[#0c1017] p-5 font-mono text-xs text-[#dbe4ee] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 text-white/50">
              <span>release-gate-diff.json</span>
              <span className="rounded bg-critical/20 px-2 py-0.5 text-critical font-semibold">Exit Code 2 (Blocked)</span>
            </div>
            <pre className="mt-4 overflow-x-auto leading-relaxed">
{`$ mcp-lock diff --from baseline.lock --to candidate.lock --json
{
  "comparable": true,
  "status": "review",
  "addedCount": 1,
  "removedCount": 0,
  "added": [
    {
      "kind": "file.read",
      "target": "/fixtures/secret.txt",
      "outcome": "allowed",
      "scenario": "read",
      "count": 1
    }
  ],
  "removed": []
}

[POLICY GATE] Candidate violates approved baseline policy:
  UNAPPROVED "file.read" "/fixtures/secret.txt" "allowed" ("read")
  Action: PR blocked in CI.`}
            </pre>
          </div>
        </div>
      </section>

      {/* 4. Empirical Study Highlights */}
      <section className="border-t border-line bg-surface/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Empirical Evidence</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                What 20 popular MCP servers actually touch at runtime.
              </h2>
              <p className="mt-3 max-w-2xl text-base text-muted">
                We ran 20 widely used community and official MCP servers through <code className="font-mono text-xs">mcp-lock observe</code>. The results reveal that unmonitored MCP processes frequently exceed their promised boundaries.
              </p>
            </div>
            <Link
              href="/security"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink shadow-sm hover:bg-inset"
            >
              Read full report <ExternalLink className="size-3.5" />
            </Link>
          </div>

          <div className="mt-10 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-inset/50 font-mono text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-6 py-4">MCP Package</th>
                    <th className="px-6 py-4">Claimed Scope</th>
                    <th className="px-6 py-4">Observed Operations</th>
                    <th className="px-6 py-4">Detected Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {EMPIRICAL_DATA.map((row, i) => (
                    <tr key={i} className="hover:bg-inset/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-ink">{row.server}</td>
                      <td className="px-6 py-4 text-muted">{row.advertised}</td>
                      <td className="px-6 py-4 font-mono text-xs text-critical font-medium">{row.observed}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                          {row.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Author-Side Wedge: The Maintainer Trust Badge */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-line bg-gradient-to-b from-surface to-inset/30 p-8 sm:p-12 shadow-sm">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-signal/20 px-3 py-1 font-mono text-xs font-semibold text-[#1e5c10]">
                Maintainer-First Proof of Innocence
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Prove to Claude Desktop, Cursor & Codex users that your server is safe.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Instead of waiting for security teams to ban your MCP tool, maintainers use <code className="font-mono text-xs">mcp-lock badge</code> to embed a cryptographically verified badge in their README. Users can inspect the exact syscall trace before installing.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center gap-2 rounded-md bg-[#2ea44f] px-3 py-1.5 font-sans text-xs font-bold text-white shadow">
                  <ShieldCheck className="size-4" /> mcp-lock: verified behavior
                </div>
                <code className="rounded border border-line bg-surface px-3 py-1.5 font-mono text-xs text-muted">
                  [![mcp-lock: verified](https://img.shields.io/badge/mcp--lock-verified_behavior-2ea44f)](behavior.lock)
                </code>
              </div>
              <div className="mt-6 flex gap-4 text-sm font-semibold">
                <Link href="/docs/cicd" className="text-primary hover:underline">
                  Turnkey GitHub Action Setup &rarr;
                </Link>
                <Link href="/features" className="text-muted hover:text-ink">
                  Explore Auto-Approve Bumps &rarr;
                </Link>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-line bg-surface p-6 shadow-sm">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">Why maintainers adopt mcp-lock</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-signal shrink-0 mt-0.5" />
                  <span><strong className="text-ink">Prevent supply chain attacks:</strong> Compromised transitive dependencies fail your CI pull-request check immediately.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-signal shrink-0 mt-0.5" />
                  <span><strong className="text-ink">Auto-approved narrower bumps:</strong> Updates that don&apos;t expand permissions pass CI without tedious manual review.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-signal shrink-0 mt-0.5" />
                  <span><strong className="text-ink">Frictionless wrapping:</strong> Wrap any <code className="font-mono text-xs">npx</code> or <code className="font-mono text-xs">uvx</code> package into a pinned non-root container in one line.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Honest Security Guarantees */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-line bg-surface p-8 sm:p-10 shadow-sm">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Honest Engineering Claims</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              What mcp-lock guarantees — and what it does not.
            </h2>
            <p className="mt-3 text-sm text-muted">
              We reject the security theater of vague AI safety badges. mcp-lock makes exact, testable technical claims:
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-line bg-inset/40 p-4">
              <h4 className="font-semibold text-sm">Never &quot;Safe&quot;</h4>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                mcp-lock never claims that unobserved code paths are safe. It records facts: no unapproved behavior occurred during the executed scenario suite.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-inset/40 p-4">
              <h4 className="font-semibold text-sm">Incomplete != Clean</h4>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                If the tracer drops events or the server times out, the result is marked <code className="font-mono text-xs font-semibold text-critical">incomplete</code> (exit code 4), failing CI automatically.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-inset/40 p-4">
              <h4 className="font-semibold text-sm">Fail Closed</h4>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                If Docker, strace, or kernel capabilities are missing, mcp-lock immediately aborts with exit code 5 rather than pretending execution succeeded.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-inset/40 p-4">
              <h4 className="font-semibold text-sm">Deterministic Digests</h4>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Evidence digests bind the server image, scenario suite, and canonical observations together via SHA-256 for tamper detection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Call To Action */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-2xl border border-line bg-gradient-to-r from-primary/10 via-surface to-signal/10 p-12 shadow-md">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Start observing your MCP servers in 60 seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted">
            Run the Go CLI locally, scan any npx or uvx server, and inspect your first behavioral lockfile today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/install"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-white shadow-md hover:bg-primary-hover"
            >
              Get Started <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/app"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-line bg-surface px-6 text-base font-semibold text-ink shadow-sm hover:bg-inset"
            >
              Developer Platform
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
