import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "Quick Start — mcp-lock Docs",
  description: "Get mcp-lock running and produce your first behavioral lockfile in minutes.",
};

export default function QuickstartPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Quick Start</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Quick start</h1>
      <p className="mt-4 text-lg text-muted">From zero to a behavioral lockfile in five commands.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">1. Build the CLI</h2>
          <CodeBlock code={`go build -ldflags "-X main.version=0.1.0" -o bin/mcp-lock ./cmd/mcp-lock
./bin/mcp-lock version`} language="sh" />
        </section>
        <section>
          <h2 className="text-xl font-semibold">2. Verify the environment</h2>
          <CodeBlock code={`./bin/mcp-lock doctor`} language="sh" />
          <p className="mt-3 text-sm text-muted">The doctor command verifies the Linux Docker daemon and the OS observation backend. Scans require a Linux container runtime; on macOS this means Docker Desktop.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">3. Observe a server</h2>
          <CodeBlock code={`./bin/mcp-lock observe -- npx -y @modelcontextprotocol/server-everything`} language="sh" />
        </section>
        <section>
          <h2 className="text-xl font-semibold">4. Validate and inspect</h2>
          <CodeBlock code={`./bin/mcp-lock validate --lock behavior.lock
./bin/mcp-lock badge --lock behavior.lock`} language="sh" />
        </section>
        <section>
          <h2 className="text-xl font-semibold">5. Compare future versions</h2>
          <CodeBlock code={`./bin/mcp-lock diff --from behavior.lock --to candidate.lock --auto-approve-narrower`} language="sh" />
        </section>
      </div>

      <div className="mt-12 rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Next step</h2>
        <p className="mt-2 text-muted">Read about the behavioral lockfile format before trusting your first baseline.</p>
        <Link href="/docs/lockfiles" className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white">Behavior lockfiles</Link>
      </div>
    </div>
  );
}
