import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your First Scan — mcp-lock Docs",
  description: "Run your first mcp-lock behavioral scan against an MCP server and generate a baseline.",
};

export default function FirstScanPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Your First Scan</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Your first scan</h1>
      <p className="mt-4 text-lg text-muted">Turn a running MCP server into a reviewed behavioral baseline.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">1. Initialize a configuration</h2>
          <p className="mt-2 text-muted">mcp-lock pins a target image and declares scenarios.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`{
  "schemaVersion": "1",
  "image": "sha256:...",
  "entrypoint": ["/app/server"],
  "protocolMode": "modern",
  "fixtureMounts": [],
  "scenarios": [{ "name": "read", "tool": "read_fixture", "arguments": {}, "expectText": "public response" }]
}`}</pre>
        </section>
        <section>
          <h2 className="text-xl font-semibold">2. Run the observation</h2>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`mcp-lock observe --config mcp-lock.json --out behavior.lock`}</pre>
          <p className="mt-3 text-sm text-muted">The observer records filesystem, network, and process events. An incomplete trace fails closed.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">3. Assess against a policy</h2>
          <p className="mt-2 text-muted">Propose a reviewed policy from the baseline, approve it, and assess candidates.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`mcp-lock policy propose --lock behavior.lock --out proposed-policy.json
mcp-lock policy assess --policy approved-policy.json --lock candidate.lock`}</pre>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/docs/lockfiles" className="text-sm font-semibold text-primary hover:underline">Next: Behavior Lockfiles →</Link>
      </div>
    </div>
  );
}
