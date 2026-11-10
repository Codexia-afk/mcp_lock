import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contributing — mcp-lock Docs",
  description: "How to contribute to the mcp-lock open-source project.",
};

export default function ContributingPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Operations</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Contributing to mcp-lock</h1>
      <p className="mt-4 text-lg text-muted">The project follows maintainer-first, fail-closed principles.</p>

      <div className="mt-8 space-y-6">
        <p className="text-muted">
          Contributions are welcome. The project requires honest security claims, fail-closed behavior, and separation of
          evidence collection from enforcement. Read the contributing guide and security policy before opening a pull request.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/docs/troubleshooting" className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink">Troubleshooting</Link>
          <a href="https://github.com/Codexia-afk/mcp_lock/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink">CONTRIBUTING.md</a>
        </div>
      </div>
    </div>
  );
}
