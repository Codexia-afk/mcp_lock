"use client";

import * as React from "react";
import { FileLock2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

interface Lockfile {
  id: string;
  serverId: string;
  version: string;
  evidenceDigest: string;
  createdAt: string;
  data: {
    server: { imageDigest: string; entrypoint: string[] };
    protocol: { version: string; transport: string };
    scenarioSuite: { digest: string; fixtureDigest: string; completed: number; total: number };
    environment: { imageDigest: string; kernel: string; arch: string };
    observer: { backend: string; version: string; lostEvents?: number; status: string };
    observations: Array<{ kind: string; target: string; outcome: string; scenario: string; count: number }>;
    evidenceDigest: string;
  };
}

export default function LockfilesPage() {
  const [lockfiles, setLockfiles] = React.useState<Lockfile[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/lockfiles");
      const data = (await res.json()) as { lockfiles?: Lockfile[] };
      setLockfiles(data.lockfiles ?? []);
      setLoading(false);
    };
    void load();
  }, []);

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
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Insights</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Behavior Lockfiles</h1>
        <p className="mt-2 text-muted">Immutable behavioral baselines generated from observations.</p>
      </div>

      {lockfiles.length === 0 ? (
        <EmptyState title="No behavioral lockfiles" description="Run a scan and generate a behavior.lock to create a baseline." />
      ) : (
        <div className="space-y-3">
          {lockfiles.map((l) => (
            <div key={l.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <FileLock2 className="size-5 text-primary" aria-hidden="true" />
                <p className="font-mono text-sm font-semibold">{l.id}</p>
                <span className="rounded-full border border-line bg-inset px-2.5 py-0.5 text-xs font-medium text-muted">v{l.version}</span>
                <span className="text-xs text-muted">{new Date(l.createdAt).toISOString()}</span>
              </div>
              <p className="mt-2 font-mono text-xs text-muted">{l.evidenceDigest}</p>
              <p className="mt-2 text-sm text-muted">
                {l.data.observations.length} observations · scenario suite {l.data.scenarioSuite.completed}/{l.data.scenarioSuite.total} completed · status {l.data.observer.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
