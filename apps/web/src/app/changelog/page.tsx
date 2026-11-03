import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — mcp-lock",
  description: "Notable changes to the mcp-lock open-source project.",
};

const releases = [
  {
    version: "0.1.0",
    date: "2026-11-02",
    entries: [
      "Initial open-source implementation: threat model, schemas, MCP protocol harness, auto-generated scenarios, npx/uvx wrapping, OS observation, behavioral lockfile, semantic diff, release-gate fixture pair, GitHub Action, trust badge, empirical study.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Changelog</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Changelog</h1>
      <p className="mt-4 text-lg text-muted">Notable changes to the mcp-lock open-source project.</p>
      <div className="mt-10 space-y-8">
        {releases.map((r) => (
          <section key={r.version} className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-mono text-xl font-bold">v{r.version}</h2>
              <time className="text-sm text-muted" dateTime={r.date}>{r.date}</time>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-muted">
              {r.entries.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-10">
        <a href="https://github.com/Codexia-afk/mcp_lock/releases" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">GitHub releases →</a>
      </div>
    </div>
  );
}
