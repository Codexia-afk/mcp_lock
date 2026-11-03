import type { Metadata } from "next";
import { CodeBlock } from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "Integrations — mcp-lock",
  description: "GitHub Actions, Docker, MCP clients, CI/CD systems, and API integrations for mcp-lock.",
};

export default function IntegrationsPage() {
  return (
    <div className="max-w-5xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Integrations</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Integrations</h1>
      <p className="mt-4 text-lg text-muted">Connect mcp-lock into the workflows where MCP server updates are reviewed.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">GitHub Actions</h2>
          <CodeBlock code={`name: mcp-lock Behavioral Audit
on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Codexia-afk/mcp_lock/.github/actions/mcp-lock
        with:
          config: mcp-lock.json
          lockfile: behavior.lock
          auto-approve-narrower: 'true'`} language="yaml" />
        </section>
        <section>
          <h2 className="text-xl font-semibold">CLI in CI</h2>
          <CodeBlock code={`mcp-lock observe --config mcp-lock.json --out behavior.lock
mcp-lock validate --lock behavior.lock
mcp-lock diff --from baseline.lock --to candidate.lock --json`} language="sh" />
        </section>
        <section>
          <h2 className="text-xl font-semibold">MCP clients</h2>
          <p className="text-muted">Developers can run mcp-lock against servers configured for supported MCP clients. Direct integration status should be confirmed per client.</p>
        </section>
      </div>
    </div>
  );
}
