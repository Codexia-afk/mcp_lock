import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "Behavior Lockfiles — mcp-lock Docs",
  description: "Understand the behavior.lock format: schema version, evidence, observations, and digests.",
};

export default function LockfilesPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Understanding Evidence</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Behavioral lockfiles</h1>
      <p className="mt-4 text-lg text-muted">A behavior.lock is a versioned record of observed runtime behavior, not a claim that unobserved behavior is safe.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Format</h2>
          <CodeBlock code={`{
  "schemaVersion": "1",
  "server": { "imageDigest": "sha256:...", "entrypoint": ["/app/server"] },
  "protocol": { "version": "2026-07-28", "transport": "stdio" },
  "scenarioSuite": { "digest": "sha256:...", "fixtureDigest": "sha256:...", "completed": 1, "total": 1 },
  "environment": { "imageDigest": "sha256:...", "kernel": "linux", "arch": "amd64" },
  "observer": { "backend": "docker-strace-linux-v1", "version": "0.1.0", "lostEvents": 0, "status": "complete" },
  "observations": [
    { "kind": "file.read", "target": "/fixtures/public.txt", "outcome": "allowed", "scenario": "read", "count": 1 }
  ],
  "evidenceDigest": "sha256:..."
}`} language="json" />
        </section>
        <section>
          <h2 className="text-xl font-semibold">Semantics</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted">
            <li>The server image digest pins the exact artifact under test.</li>
            <li>The scenario suite digest pins the executed tests.</li>
            <li>Observability backends report lost events; lost events force an incomplete result.</li>
            <li>Evidence digests cover normalized observations.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Honest limits</h2>
          <p className="text-muted">Dynamic tests cannot establish the absence of hidden behavior. Coverage depends on executed scenarios, and some operations may be unobservable.</p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/docs/permission-changes" className="text-sm font-semibold text-primary hover:underline">Next: Permission Changes →</Link>
      </div>
    </div>
  );
}
