import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scenario Generation — mcp-lock Docs",
  description: "How mcp-lock auto-generates starter scenarios from MCP tool schemas.",
};

export default function ScenariosDocsPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Understanding Evidence</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Scenario generation</h1>
      <p className="mt-4 text-lg text-muted">Starter scenarios inferred from tools/list schemas.</p>
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold">How it works</h2>
          <p className="mt-2 text-muted">mcp-lock inspects advertised tool schemas and synthesizes safe, non-destructive starter scenarios. Coverage is not exhaustive.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Commands</h2>
          <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`mcp-lock init --image sha256:... --out mcp-lock.json
mcp-lock scenario generate --config mcp-lock.json
mcp-lock scenario check --config mcp-lock.json`}</pre>
        </section>
      </div>
      <div className="mt-12">
        <Link href="/docs/lockfiles" className="text-sm font-semibold text-primary hover:underline">Next: Behavior Lockfiles →</Link>
      </div>
    </div>
  );
}
