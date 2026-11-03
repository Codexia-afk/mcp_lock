import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation — mcp-lock",
  description: "Official mcp-lock documentation: quick start, installation, CLI usage, behavioral lockfiles, policy assessment, and security model.",
};

export default function DocsIndexPage() {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Welcome to mcp-lock</h1>
      <p className="mt-4 text-lg text-muted">
        mcp-lock is an open-source developer security tool for observing MCP server runtime behavior, recording behavioral
        baselines, and detecting unexpected permission changes.
      </p>
      <div className="mt-8 space-y-6 rounded-xl border border-line bg-surface p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Start in minutes</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-6 text-sm text-muted">
            <li>Install the CLI and verify the Linux Docker observation backend.</li>
            <li>Run an isolated observation against an MCP server.</li>
            <li>Review the generated behavioral lockfile.</li>
            <li>Compare future versions and assess policies.</li>
          </ol>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/docs/quickstart" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white">Quick start</Link>
          <Link href="/install" className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink">Installation</Link>
          <Link href="/docs/cli" className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink">CLI reference</Link>
        </div>
      </div>
      <div className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Core concepts</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted">
          <li>
            <Link className="font-medium text-ink hover:text-primary" href="/docs/lockfiles">Behavioral lockfiles</Link> — versioned
            records of observed runtime behavior.
          </li>
          <li>
            <Link className="font-medium text-ink hover:text-primary" href="/docs/permission-changes">Permission changes</Link> — semantic
            diffs between lockfiles that detect added capabilities.
          </li>
          <li>
            <Link className="font-medium text-ink hover:text-primary" href="/docs/policy">Policy assessment</Link> — reviewed permission
            decisions evaluated against candidate evidence.
          </li>
        </ul>
      </div>
      <div className="mt-12">
        <Link href="/docs/quickstart" className="text-sm font-semibold text-primary hover:underline">Continue: Quick Start →</Link>
      </div>
    </div>
  );
}
