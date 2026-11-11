"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ScanLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

interface Scan {
  id: string;
  serverId: string;
  status: "completed" | "incomplete" | "failed";
  backend: string;
  startedAt: string;
  completedAt?: string;
  evidenceDigest: string;
  complete: boolean;
  events: Array<{ kind: string; target: string; outcome: string; scenario: string; count: number }>;
}

function ScansContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") ?? "";
  const [scans, setScans] = React.useState<Scan[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/scans${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""}`);
      const data = (await res.json()) as { scans?: Scan[] };
      setScans(data.scans ?? []);
      setLoading(false);
    };
    void load();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <SkeletonText lines={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Scan History</h1>
        <p className="mt-2 text-muted">Behavioral observations recorded by the mcp-lock engine.</p>
      </div>

      {scans.length === 0 ? (
        <EmptyState title="No scans yet" description="Upload a behavior.lock or run mcp-lock locally and upload the result." />
      ) : (
        <div className="space-y-3">
          {scans.map((s) => (
            <Link key={s.id} href={`/app/scans/${s.id}`} className="block rounded-xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-wrap items-center gap-3">
                <ScanLine className="size-5 text-primary" aria-hidden="true" />
                <p className="font-mono text-sm font-semibold">{s.id}</p>
                <Badge variant={s.status === "completed" ? "success" : "warning"}>{s.status}</Badge>
                <span className="text-xs text-muted">backend: {s.backend}</span>
              </div>
              <p className="mt-2 text-sm text-muted">Started {new Date(s.startedAt).toISOString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScansPage() {
  return (
    <React.Suspense fallback={<div className="space-y-6"><Skeleton className="h-8 w-56" /><SkeletonText lines={4} /></div>}>
      <ScansContent />
    </React.Suspense>
  );
}
