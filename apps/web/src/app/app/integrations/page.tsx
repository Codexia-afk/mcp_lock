import type { Metadata } from "next";
import { CodeBlock } from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "Integrations — mcp-lock SaaS",
  description: "Integrations between the mcp-lock platform and developer workflows.",
};

export default function AppIntegrationsPage() {
  return (
    <div className="max-w-5xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Administration</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Integrations</h1>
      <p className="mt-4 text-lg text-muted">Connect mcp-lock with your development workflows.</p>
      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">GitHub Actions</h2>
          <CodeBlock
            code={`name: mcp-lock Behavioral Audit
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
          auto-approve-narrower: 'true'`}
            language="yaml"
          />
        </section>
        <section>
          <h2 className="text-xl font-semibold">API credentials</h2>
          <p className="mt-2 text-muted">Create scoped API keys under Settings → API Keys to authenticate automated scan ingestion.</p>
        </section>
      </div>
    </div>
  );
}
