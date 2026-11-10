"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { CodeBlock } from "@/components/ui/code-block";

export interface CommandDoc {
  name: string;
  purpose: string;
  syntax: string[];
  examples: string[];
  exitCodes: Array<{ code: number; meaning: string }>;
}

const COMMANDS: CommandDoc[] = [
  {
    name: "doctor",
    purpose: "Verify the host platform, Linux Docker daemon, and observation backends.",
    syntax: ["mcp-lock doctor"],
    examples: ["mcp-lock doctor"],
    exitCodes: [
      { code: 0, meaning: "Environment ready." },
      { code: 5, meaning: "Docker daemon unavailable or not Linux." },
    ],
  },
  {
    name: "observe",
    purpose: "Record OS behavioral evidence from an MCP server execution into a behavior.lock.",
    syntax: ["mcp-lock observe --config FILE [--out behavior.lock] [--backend docker|emulated]", "mcp-lock observe -- <npx|uvx command...>"],
    examples: [
      "mcp-lock observe --config mcp-lock.json --out behavior.lock",
      "mcp-lock observe -- npx -y @modelcontextprotocol/server-everything",
    ],
    exitCodes: [
      { code: 0, meaning: "Observation recorded." },
      { code: 3, meaning: "Usage error (config or flags)." },
      { code: 5, meaning: "Unsafe execution refused or backend unavailable." },
      { code: 6, meaning: "Observation failed." },
      { code: 7, meaning: "Failed to write behavior.lock." },
    ],
  },
  {
    name: "diff",
    purpose: "Compare two behavior.lock files and report added or removed capabilities.",
    syntax: ["mcp-lock diff --from FILE --to FILE [--auto-approve-narrower] [--json]"],
    examples: [
      "mcp-lock diff --from baseline.lock --to candidate.lock",
      "mcp-lock diff --from baseline.lock --to candidate.lock --auto-approve-narrower",
      "mcp-lock diff --from baseline.lock --to candidate.lock --json",
    ],
    exitCodes: [
      { code: 0, meaning: "Pass." },
      { code: 2, meaning: "Review required (behavior changed)." },
      { code: 3, meaning: "Usage error." },
      { code: 4, meaning: "Incomplete evidence." },
    ],
  },
  {
    name: "policy",
    purpose: "Propose or assess reviewed permission policies.",
    syntax: [
      "mcp-lock policy propose --lock FILE --out FILE [--json]",
      "mcp-lock policy assess --policy FILE --lock FILE [--allow-narrower] [--json]",
    ],
    examples: [
      "mcp-lock policy propose --lock behavior.lock --out proposed-policy.json",
      "mcp-lock policy assess --policy approved-policy.json --lock candidate.lock",
    ],
    exitCodes: [
      { code: 0, meaning: "Candidate fits the approved policy." },
      { code: 2, meaning: "Unapproved capabilities or identity change requiring review." },
      { code: 3, meaning: "Usage error." },
      { code: 4, meaning: "Invalid or incomplete evidence." },
      { code: 7, meaning: "Failed to write policy." },
    ],
  },
  {
    name: "scenario",
    purpose: "Check MCP protocol behavior against scenario configurations, or generate starter scenarios.",
    syntax: ["mcp-lock scenario check --config FILE", "mcp-lock scenario generate --config FILE"],
    examples: [
      "mcp-lock scenario check --config mcp-lock.json",
      "mcp-lock scenario generate --config mcp-lock.json",
    ],
    exitCodes: [
      { code: 0, meaning: "Scenarios passed." },
      { code: 3, meaning: "Usage error." },
      { code: 6, meaning: "Scenario failed." },
    ],
  },
  {
    name: "badge",
    purpose: "Generate the maintainer trust badge and evidence summary.",
    syntax: ["mcp-lock badge --lock FILE [--json]"],
    examples: ["mcp-lock badge --lock behavior.lock"],
    exitCodes: [{ code: 0, meaning: "Badge emitted." }, { code: 3, meaning: "Lockfile could not be read or validated." }],
  },
  {
    name: "wrap",
    purpose: "Build an isolated pinned container from an npx or uvx invocation.",
    syntax: ["mcp-lock wrap --npx PACKAGE [--out config.json]", "mcp-lock wrap --uvx PACKAGE [--out config.json]"],
    examples: ["mcp-lock wrap --npx @modelcontextprotocol/server-filesystem --out mcp-lock.json"],
    exitCodes: [
      { code: 0, meaning: "Configuration written." },
      { code: 3, meaning: "Usage error." },
      { code: 5, meaning: "Wrap failed." },
      { code: 7, meaning: "Failed to write config." },
    ],
  },
  {
    name: "init",
    purpose: "Initialize an mcp-lock configuration with a starter scenario.",
    syntax: ["mcp-lock init --image sha256:DIGEST --out config.json"],
    examples: ["mcp-lock init --image sha256:0000000000000000000000000000000000000000000000000000000000000000 --out mcp-lock.json"],
    exitCodes: [
      { code: 0, meaning: "Configuration written." },
      { code: 3, meaning: "Usage error." },
      { code: 7, meaning: "Failed to write config." },
    ],
  },
  {
    name: "validate",
    purpose: "Validate a behavior.lock against the canonical schema.",
    syntax: ["mcp-lock validate --lock FILE"],
    examples: ["mcp-lock validate --lock behavior.lock"],
    exitCodes: [
      { code: 0, meaning: "Valid and complete." },
      { code: 3, meaning: "Usage error or invalid lockfile." },
      { code: 4, meaning: "Structurally valid but evidence incomplete." },
    ],
  },
];

export function CommandExplorer() {
  const [query, setQuery] = React.useState("");
  const filtered = COMMANDS.filter((c) => `${c.name} ${c.purpose} ${c.syntax.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const [selected, setSelected] = React.useState(COMMANDS[0].name);
  const active = COMMANDS.find((c) => c.name === selected) ?? COMMANDS[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands…"
            className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            aria-label="Search CLI commands"
          />
        </div>
        <div className="space-y-1 rounded-xl border border-line bg-surface p-2">
          {filtered.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setSelected(c.name)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${c.name === active.name ? "bg-inset text-ink" : "text-muted hover:bg-inset hover:text-ink"}`}
            >
              <span className="font-mono">{c.name}</span>
              <span className="ml-2 text-xs font-normal text-muted">{c.purpose}</span>
            </button>
          ))}
          {filtered.length === 0 ? <p className="px-3 py-4 text-sm text-muted">No commands match your search.</p> : null}
        </div>
      </div>
      <div className="min-w-0">
        <h2 className="font-mono text-2xl font-bold">
          mcp-lock <span className="text-primary">{active.name}</span>
        </h2>
        <p className="mt-2 text-muted">{active.purpose}</p>
        {active.syntax.map((s) => (
          <div key={s} className="mt-4">
            <p className="font-mono text-xs text-muted">Syntax</p>
            <CodeBlock code={s} showCopy={false} />
          </div>
        ))}
        <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted">Examples</h3>
        {active.examples.map((e) => (
          <div key={e} className="mt-2">
            <CodeBlock code={e} />
          </div>
        ))}
        <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted">Exit codes</h3>
        <ul className="space-y-1 text-sm">
          {active.exitCodes.map((e) => (
            <li key={e.code} className="flex gap-3">
              <span className="font-mono font-semibold text-primary">{e.code}</span>
              <span className="text-muted">{e.meaning}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
