import type { Metadata } from "next";
import { CommandExplorer } from "@/components/docs/command-explorer";

export const metadata: Metadata = {
  title: "CLI Commands — mcp-lock Docs",
  description: "Complete reference for mcp-lock CLI commands, flags, examples, and exit codes.",
};

export default function CliDocsPage() {
  return (
    <div className="max-w-5xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Operations</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">CLI reference</h1>
      <p className="mt-4 text-lg text-muted">Every supported command, verified against the current release of the mcp-lock CLI.</p>
      <div className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-sm">
        <CommandExplorer />
      </div>
      <div className="mt-12">
        <a href="https://github.com/Codexia-afk/mcp_lock/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">
          Full command documentation in the repository README →
        </a>
      </div>
    </div>
  );
}
