import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  FileLock2,
  GitCompareArrows,
  ShieldCheck,
  Workflow,
  Lightbulb,
  Package,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features — mcp-lock",
  description:
    "Behavioral runtime observation, behavioral lockfiles, permission drift detection, scenario testing, sandbox execution, policy assessment, and CI/CD integration.",
};

const FEATURES = [
  {
    id: "behavioral-runtime-observation",
    icon: Eye,
    title: "OS Behavioral Observation (strace)",
    summary: "Traces raw syscalls inside an isolated Linux sandbox container.",
    body: "mcp-lock executes MCP servers in a disposable Linux container with network disabled, read-only root filesystems, dropped capabilities, and non-root execution (UID 65532:65532). The docker-strace-linux-v1 backend captures openat, creat, connect, and execve syscalls with active trace health monitoring.",
    cmd: "mcp-lock observe --config mcp-lock.json --out behavior.lock",
  },
  {
    id: "frictionless-wrapping",
    icon: Package,
    title: "Zero-Friction npx & uvx Auto-Wrapping",
    summary: "Run published packages immediately without manual Dockerfiles.",
    body: "Eliminates the container authoring friction. Point mcp-lock at any published npm package or Python uvx tool, and the wrap engine pins dependencies, builds a minimal isolated image, and executes observation in one step.",
    cmd: "mcp-lock observe -- npx -y @modelcontextprotocol/server-everything",
  },
  {
    id: "behavioral-lockfiles",
    icon: FileLock2,
    title: "Behavioral Lockfiles (v1 Schema)",
    summary: "Immutable, version-controlled records of observed runtime activity.",
    body: "Every scan outputs a canonical behavior.lock file validated against behavior-lock.v1.schema.json. It records server image identity, protocol mode, environment details, scenario suites, normalized observations, and a cryptographic evidenceDigest.",
    cmd: "mcp-lock validate --lock behavior.lock",
  },
  {
    id: "permission-drift-detection",
    icon: GitCompareArrows,
    title: "Semantic Capability Diffing",
    summary: "Smart auto-approval for narrower permissions; blocks expanded access.",
    body: "The diff engine distinguishes added versus removed capabilities. Updates with identical or narrower permissions pass CI cleanly with --auto-approve-narrower, while unexpected file reads or network egress return exit code 2 to fail the build.",
    cmd: "mcp-lock diff --from baseline.lock --to candidate.lock --auto-approve-narrower",
  },
  {
    id: "scenario-based-testing",
    icon: Lightbulb,
    title: "Auto-Generated Starter Scenarios",
    summary: "Synthesizes type-safe, non-destructive test inputs from tools/list.",
    body: "Overcomes test authoring hurdles by reading the MCP server's tools/list JSON schemas and automatically generating non-destructive scenarios for file read, database query, and status checks.",
    cmd: "mcp-lock scenario generate --config mcp-lock.json",
  },
  {
    id: "cicd-integration",
    icon: Workflow,
    title: "Maintainer-First CI/CD & Trust Badges",
    summary: "Turnkey GitHub Action and verifiable Markdown trust badges.",
    body: "Add our reusable GitHub Action (.github/actions/mcp-lock) to your pull request workflow. Maintainers can embed the verified trust badge in their README, signaling enterprise safety to Claude, Cursor, and Codex users.",
    cmd: "mcp-lock badge --lock behavior.lock",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-20 px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Engine Capabilities</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Features
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
          Everything the open-source mcp-lock engine does, backed by deterministic operating system syscall tracing and verifiable lockfile schemas.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="space-y-8">
        {FEATURES.map((feat) => (
          <section
            key={feat.id}
            id={feat.id}
            className="scroll-mt-24 grid gap-6 rounded-2xl border border-line bg-surface p-8 shadow-sm lg:grid-cols-[1.3fr_0.9fr] lg:items-center"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-inset text-primary">
                  <feat.icon className="size-5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">{feat.title}</h2>
              </div>
              <p className="mt-3 font-semibold text-sm text-ink">{feat.summary}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feat.body}</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-[#0c1017] p-4 font-mono text-xs text-[#dbe4ee]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px] text-white/40">
                <span>cli command</span>
                <span>bash</span>
              </div>
              <div className="mt-3 overflow-x-auto text-signal">
                $ {feat.cmd}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Security notice */}
      <div className="rounded-2xl border border-line bg-inset/40 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold">Understand the security model</h3>
          <p className="text-sm text-muted">Read our honest technical guarantees, threat model, and fail-closed exit codes.</p>
        </div>
        <Link
          href="/security"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow hover:bg-primary-hover"
        >
          Security Model <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
