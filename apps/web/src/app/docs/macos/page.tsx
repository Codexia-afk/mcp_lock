import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "macOS Setup — mcp-lock Docs",
  description: "Set up mcp-lock on macOS with Docker Desktop and a Linux container engine.",
};

export default function MacosDocsPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Installation</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">macOS setup</h1>
      <p className="mt-4 text-lg text-muted">Observations on macOS run inside Linux containers via Docker Desktop.</p>
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold">Requirements</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted">
            <li>Apple Silicon or Intel Mac.</li>
            <li>Docker Desktop with Linux container engine enabled.</li>
            <li>Go 1.26+ if building from source.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Verify</h2>
          <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`docker info --format "{{.OSType}} {{.ServerVersion}}"
mcp-lock doctor`}</pre>
          <p className="mt-3 text-sm text-muted">macOS-hosted Linux containers observe Linux-container behavior; native macOS system-call monitoring is not claimed.</p>
        </section>
      </div>
      <div className="mt-12">
        <Link href="/install" className="text-sm font-semibold text-primary hover:underline">Back to installation →</Link>
      </div>
    </div>
  );
}
