import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "Troubleshooting — mcp-lock Docs",
  description: "Common mcp-lock installation, observation, and diff failures and how to resolve them.",
};

export default function TroubleshootingPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Operations</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Troubleshooting</h1>
      <p className="mt-4 text-lg text-muted">Practical fixes for the most common local and CI failures.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Docker daemon unavailable</h2>
          <p className="mt-2 text-muted">Observations require a Linux Docker daemon.</p>
          <CodeBlock code={`docker info --format "{{.OSType}} {{.ServerVersion}}"
docker context ls`} language="sh" />
        </section>
        <section>
          <h2 className="text-xl font-semibold">Permission denied on /var/run/docker.sock</h2>
          <p className="mt-2 text-muted">Add the current user to the docker group or run the CLI with appropriate group membership. Avoid blanket sudo usage for scans.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Observation incomplete / exit code 4</h2>
          <p className="mt-2 text-muted">Lost trace events or truncated execution force an incomplete lockfile; the release gate fails closed.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Policy rejected (exit code 2)</h2>
          <p className="mt-2 text-muted">The candidate behavior exceeded the approved policy. Run a diff to inspect the added capabilities.</p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/docs/cli" className="text-sm font-semibold text-primary hover:underline">Next: CLI Commands →</Link>
      </div>
    </div>
  );
}
