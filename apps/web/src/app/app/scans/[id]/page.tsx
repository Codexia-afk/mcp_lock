import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/api-context";
import { getDb } from "@/lib/db";
import { getScan } from "@/lib/queries";
import type { Scan } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function generateStaticParams() {
  return [{ id: "sample-scan-001" }];
}

export default async function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let scan: Scan | null = null;

  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    scan = {
      id: "sample-scan-001",
      serverId: "srv_sample",
      status: "completed",
      backend: "bpf_trace",
      startedAt: "2026-11-10T00:00:00.000Z",
      completedAt: "2026-11-10T00:01:00.000Z",
      evidenceDigest: "sha256:4b918a0a91e5df784b15...",
      events: [
        { scenario: "init", kind: "file", target: "/app/config.json", outcome: "allowed", count: 1 } as any,
        { scenario: "read", kind: "network", target: "api.github.com:443", outcome: "allowed", count: 2 } as any,
      ],
      observerLostEvents: 0,
    } as Scan;
  } else {
    const auth = await getAuthContext(new Request(`http://localhost/api/scans/${id}`, { headers: await headers() }));
    scan = getScan(id);

    if (!scan) {
      notFound();
    }
    const db = getDb();
    const server = scan ? (db.prepare("SELECT * FROM servers WHERE id = ?").get(scan.serverId) as any) : null;
    if (!server || server.workspace_id !== auth.workspaceId) {
      notFound();
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Scan detail</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-bold tracking-tight">{scan.id}</h1>
          <Badge variant={scan.status === "completed" ? "success" : "warning"}>{scan.status}</Badge>
          <Badge variant="neutral">backend: {scan.backend}</Badge>
        </div>
        <p className="mt-2 text-muted">Started {new Date(scan.startedAt).toISOString()}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-sm font-medium text-muted">Evidence digest</p>
          <p className="mt-2 font-mono text-sm">{scan.evidenceDigest}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-sm font-medium text-muted">Scenarios</p>
          <p className="mt-2 text-sm">
            {scan.events.length} observation{scan.events.length === 1 ? "" : "s"} captured
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-sm font-medium text-muted">Lost events</p>
          <p className="mt-2 text-sm">{scan.observerLostEvents ?? 0}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-sm font-medium text-muted">Complete</p>
          <p className="mt-2 text-sm">{scan.complete ? "Yes" : "No"}</p>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Observed events</h2>
        {scan.events.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No observations were recorded.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {scan.events.map((e, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-4 py-3 text-sm">
                <Badge variant={e.outcome === "allowed" ? "success" : "critical"}>{e.outcome}</Badge>
                <span className="font-mono font-semibold">{e.kind}</span>
                <code className="rounded bg-inset px-2 py-0.5 font-mono text-xs">{e.target}</code>
                <span className="text-muted">scenario: {e.scenario}</span>
                <span className="text-muted">count: {e.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline">
          Export report
        </Button>
        <Button
          variant="outline"
          disabled
        >
          Compare with baseline
        </Button>
      </div>
    </div>
  );
}
