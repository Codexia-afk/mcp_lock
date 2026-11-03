import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Policy Assessment — mcp-lock Docs",
  description: "How to propose and assess reviewed permission policies in mcp-lock.",
};

export default function PolicyDocsPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Operations</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Policy assessment</h1>
      <p className="mt-4 text-lg text-muted">Propose, approve, and assess reviewed permission policies.</p>
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold">Workflow</h2>
          <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`mcp-lock policy propose --lock behavior.lock --out proposed-policy.json
# maintainer review...
mcp-lock policy assess --policy approved-policy.json --lock candidate.lock`}</pre>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Important boundary</h2>
          <p className="mt-2 text-muted">Policy assessment is a review aid; it does not itself enforce runtime permissions.</p>
        </section>
      </div>
      <div className="mt-12">
        <Link href="/docs/cicd" className="text-sm font-semibold text-primary hover:underline">Next: CI/CD Integration →</Link>
      </div>
    </div>
  );
}
