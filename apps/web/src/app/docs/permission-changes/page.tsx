import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Permission Changes — mcp-lock Docs",
  description: "How mcp-lock detects permission drift between behavioral lockfiles.",
};

export default function PermissionChangesPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Understanding Evidence</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Permission changes</h1>
      <p className="mt-4 text-lg text-muted">Detecting newly observed capabilities between lockfile versions.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">How drift is detected</h2>
          <p className="mt-2 text-muted">mcp-lock compares normalized observations from two complete lockfiles.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`mcp-lock diff --from baseline.lock --to candidate.lock --json
mcp-lock diff --from baseline.lock --to candidate.lock --auto-approve-narrower`}</pre>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Interpreting results</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted">
            <li>
              <span className="font-semibold text-critical">review</span> — new capabilities were observed; approval is required.
            </li>
            <li>
              <span className="font-semibold text-signal">pass</span> — no added capabilities, or a narrower permission set was confirmed.
            </li>
            <li>
              <span className="font-semibold text-warning">incomplete</span> — evidence was incomplete; the comparison is not trusted.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">What a diff means</h2>
          <p className="text-muted">A new observation is evidence of behavior, not proof of malice. Reviewers decide whether the change is acceptable.</p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/docs/cicd" className="text-sm font-semibold text-primary hover:underline">Next: CI/CD Integration →</Link>
      </div>
    </div>
  );
}
