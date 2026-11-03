import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Windows Setup — mcp-lock Docs",
  description: "Set up mcp-lock on Windows via WSL2 or Docker Desktop.",
};

export default function WindowsDocsPage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Documentation / Installation</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Windows setup</h1>
      <p className="mt-4 text-lg text-muted">Set up mcp-lock on Windows through WSL2 or Docker Desktop.</p>
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold">Requirements</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted">
            <li>Windows 10/11.</li>
            <li>WSL2 or Docker Desktop in Linux mode.</li>
            <li>Go 1.26+ if building from source.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">First observation</h2>
          <pre className="overflow-x-auto rounded-lg border border-line bg-[#0f141b] p-4 font-mono text-[13px] text-[#dbe4ee]">{`mcp-lock observe -- npx -y @modelcontextprotocol/server-everything`}</pre>
          <p className="mt-3 text-sm text-muted">Observations happen inside Linux containers; use WSL2-compatible paths.</p>
        </section>
      </div>
      <div className="mt-12">
        <Link href="/install" className="text-sm font-semibold text-primary hover:underline">Back to installation →</Link>
      </div>
    </div>
  );
}
