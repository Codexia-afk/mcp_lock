import type { Metadata } from "next";
import { CodeBlock } from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "CI/CD Integration — mcp-lock Docs",
  description: "Run mcp-lock behavioral release gates in GitHub Actions.",
};

export default function CicdPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Operations</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">CI/CD integration</h1>
      <p className="mt-4 text-lg text-muted">Turn behavioral drift into a release gate.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">GitHub Actions release gate</h2>
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
          <p className="mt-3 text-sm text-muted">The action runs the observation, validates the lockfile, compares against the baseline, and fails when new capabilities are detected.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Exit codes</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted">
            <li><span className="font-mono">0</span> — pass.</li>
            <li><span className="font-mono">2</span> — review required (behavior change or policy drift).</li>
            <li><span className="font-mono">3</span> — usage error.</li>
            <li><span className="font-mono">4</span> — incomplete evidence.</li>
            <li><span className="font-mono">5</span> — fail closed (missing isolation or observation capability).</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
