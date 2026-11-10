import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  FileCheck2,
  Cpu,
  FileLock2,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Security Model — mcp-lock",
  description:
    "Authoritative security guarantees, threat model, sandbox boundaries, fail-closed exit codes, and evidence integrity of mcp-lock.",
};

const EXIT_CODES = [
  { code: "0", name: "Clean Pass / Auto-Approved", desc: "No unapproved operations observed. If changes occurred, they were narrower or identical and approved via --auto-approve-narrower." },
  { code: "2", name: "Security Gate Rejection", desc: "Unapproved capabilities detected (e.g. unexpected file read, SSRF connect). CI pull request must be blocked." },
  { code: "3", name: "Usage / Schema Error", desc: "Invalid arguments, malformed JSON config, or behavior.lock schema validation failure." },
  { code: "4", name: "Incomplete Evidence", desc: "Tracer buffer overflowed, lost events > 0, or test scenarios failed. Incomplete evidence is never treated as clean." },
  { code: "5", name: "Fail Closed", desc: "Docker daemon unavailable, Linux sandbox capability check failed, or isolation requirements unmet." },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Security Architecture</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Security model & honest guarantees
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
          We reject the cybersecurity culture of exaggerated safety claims. mcp-lock makes exact, testable technical commitments based on verifiable runtime facts.
        </p>
      </div>

      {/* Threat Model */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">1. The Threat Model</h2>
          <p className="mt-2 text-muted">What mcp-lock defends against in the Model Context Protocol ecosystem.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-ink">Compromised Dependencies</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Transitive npm or PyPI packages silently modified to read <code className="font-mono text-xs">~/.ssh</code> or AWS metadata endpoints. mcp-lock flags these additions in CI before release.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-ink">SSRF & Cloud Metadata Probes</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Tools intended for external web browsing (e.g. fetch tools) tricked into calling <code className="font-mono text-xs">169.254.169.254</code> or localhost services. Network connects are isolated and recorded.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <h3 className="font-semibold text-lg text-ink">Arbitrary Subprocess Spawning</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              MCP servers triggering Git hooks or executing bash subshells. Every <code className="font-mono text-xs">execve</code> call is captured with its executable SHA-256 digest.
            </p>
          </div>
        </div>
      </section>

      {/* Fail Closed Exit Codes */}
      <section className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight">2. Fail-Closed Exit Code Semantics</h2>
        <p className="mt-2 text-sm text-muted">mcp-lock uses deterministic UNIX exit codes to enforce security release gates in CI pipelines.</p>

        <div className="mt-8 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-inset/50 font-mono text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-6 py-3">Exit Code</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Meaning & CI Pipeline Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {EXIT_CODES.map((e) => (
                <tr key={e.code}>
                  <td className="px-6 py-4 font-mono font-bold text-primary">{e.code}</td>
                  <td className="px-6 py-4 font-semibold text-ink">{e.name}</td>
                  <td className="px-6 py-4 text-xs text-muted leading-relaxed">{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Honest Claims */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">3. What mcp-lock Does Not Claim</h2>
          <p className="mt-2 text-muted">Explicit boundaries to ensure engineers never misunderstand our guarantees.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-inset/30 p-6">
            <h4 className="font-bold text-base text-ink flex items-center gap-2">
              <XCircle className="size-5 text-critical" /> We Never Claim Code is &quot;Safe&quot;
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              mcp-lock never claims that an MCP server is guaranteed safe. Dynamic tracing can only prove that unapproved operations were not observed during the executed scenario suite.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-inset/30 p-6">
            <h4 className="font-bold text-base text-ink flex items-center gap-2">
              <XCircle className="size-5 text-critical" /> Incomplete Telemetry != Clean
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              If the ptrace buffer drops events or an execution times out, mcp-lock rejects the observation with exit code 4. Dropped telemetry is never assumed to be clean.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-inset/30 p-6">
            <h4 className="font-bold text-base text-ink flex items-center gap-2">
              <XCircle className="size-5 text-critical" /> Tracer Boundary vs Hostile Red Teams
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The contained Linux strace backend is designed for development and CI defense against benign regressions and compromised dependencies. Hostile adversaries with kernel exploits require microVMs or out-of-band eBPF hardware hypervisors.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-inset/30 p-6">
            <h4 className="font-bold text-base text-ink flex items-center gap-2">
              <CheckCircle2 className="size-5 text-signal" /> Immutable Cryptographic Evidence
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The <code className="font-mono text-xs">evidenceDigest</code> binds the exact OCI image digest, test suite digest, and normalized observations together via SHA-256 for verifiable tamper detection.
            </p>
          </div>
        </div>
      </section>

      {/* Docs link */}
      <div className="flex items-center justify-between border-t border-line pt-8">
        <Link href="/docs/security" className="font-semibold text-primary hover:underline">
          Read the complete security documentation &rarr;
        </Link>
        <a
          href="https://github.com/Codexia-afk/mcp_lock/blob/main/docs/THREAT_MODEL.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          View THREAT_MODEL.md on GitHub <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
