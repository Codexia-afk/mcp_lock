import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — mcp-lock",
  description: "About the mcp-lock project, its mission, and its open-source maintainer-first approach.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">About</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">About mcp-lock</h1>
      <div className="mt-6 space-y-4 text-lg text-muted">
        <p>
          mcp-lock was built by developers who were tired of trusting MCP server tool descriptions without evidence. The
          Model Context Protocol lets AI applications call external tools, but a tool description is a claim, not a
          permission boundary.
        </p>
        <p>
          The project therefore treats behavioral evidence as a first-class artifact: versioned lockfiles, normalized
          runtime observations, semantic diffs, and reviewed policies.
        </p>
        <p>
          The project follows an author-side wedge: maintainers can prove innocence, automate release gates, and publish
          verified trust badges for their servers.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">Back to home</Link>
        <a href="https://github.com/Codexia-afk/mcp_lock" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink">GitHub</a>
      </div>
    </div>
  );
}
