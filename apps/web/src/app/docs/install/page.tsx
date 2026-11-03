import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Installation — mcp-lock Docs",
  description: "Installation overview for mcp-lock on macOS, Linux, and Windows.",
};

export default function DocsInstallPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Installation</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Installation</h1>
      <p className="mt-4 text-lg text-muted">Install the mcp-lock CLI and prepare an observation environment.</p>
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold">From source</h2>
          <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`go build -ldflags "-X main.version=0.1.0" -o bin/mcp-lock ./cmd/mcp-lock
./bin/mcp-lock doctor`}</pre>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Build from source requirements</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted">
            <li>Go 1.26 or later.</li>
            <li>Docker with a Linux container engine for observations.</li>
          </ul>
        </section>
      </div>
      <div className="mt-12">
        <Link href="/install" className="text-sm font-semibold text-primary hover:underline">Back to installation guides →</Link>
      </div>
    </div>
  );
}
