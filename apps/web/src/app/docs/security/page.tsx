import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security Model — mcp-lock Docs",
  description: "Threat model, isolation boundaries, and honest security limitations of mcp-lock.",
};

export default function SecurityDocsPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Operations</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Security model</h1>
      <p className="mt-4 text-lg text-muted">How mcp-lock boundaries evidence collection from enforcement, and what it cannot guarantee.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Threat model</h2>
          <p className="mt-2 text-muted">Untrusted MCP server code, scenario-controlled inputs, and untrusted filesystem paths are the primary adversary classes.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Isolation</h2>
          <p className="mt-2 text-muted">Observations run in disposable Linux containers with network disabled, read-only filesystem, dropped capabilities, and non-root UID.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Honest limitations</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted">
            <li>Dynamic tests cannot establish the absence of hidden behavior.</li>
            <li>Policy assessment is not runtime enforcement.</li>
            <li>Container boundaries are not absolute security boundaries.</li>
          </ul>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/security" className="text-sm font-semibold text-primary hover:underline">Next: Security Overview →</Link>
      </div>
    </div>
  );
}
