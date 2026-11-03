"use client";

import * as React from "react";
import { GitCompareArrows, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

interface Lockfile {
  id: string;
  version: string;
  createdAt: string;
  data: { server: { imageDigest: string; entrypoint: string[] }; observations: Array<{ kind: string; target: string; outcome: string; scenario: string; count: number }> };
  evidenceDigest: string;
}

interface DiffReport {
  comparable: boolean;
  reasons: string[];
  added: Array<{ kind: string; target: string; outcome: string; scenario: string; count: number }>;
  removed: Array<{ kind: string; target: string; outcome: string; scenario: string; count: number }>;
  addedCount: number;
  removedCount: number;
  autoApproveNarrower: boolean;
  status: "pass" | "review" | "incomplete";
  identityChanged: boolean;
}

export default function ComparePage() {
  const [lockfiles, setLockfiles] = React.useState<Lockfile[]>([]);
  const [baselineId, setBaselineId] = React.useState("");
  const [candidateId, setCandidateId] = React.useState("");
  const [autoApproveNarrower, setAutoApproveNarrower] = React.useState(false);
  const [report, setReport] = React.useState<DiffReport | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/lockfiles");
      const data = (await res.json()) as { lockfiles?: Lockfile[] };
      const items = data.lockfiles ?? [];
      setLockfiles(items);
      if (items.length > 0) {
        setBaselineId(items[0].id);
        setCandidateId(items[items.length - 1].id);
      }
    };
    void load();
  }, []);

  const onCompare = async () => {
    if (!baselineId || !candidateId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/diffs", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ baselineLockId: baselineId, candidateLockId: candidateId, autoApproveNarrower }),
      });
      const data = (await res.json().catch(() => null)) as { diff?: DiffReport; error?: { message?: string } };
      if (!res.ok) {
        setError(data?.error?.message ?? "Comparison failed");
        return;
      }
      setReport(data.diff ?? null);
    } finally {
      setBusy(false);
    }
  };

  if (lockfiles.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Insights</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Compare Behavior</h1>
        </div>
        <EmptyState title="No lockfiles to compare" description="Generate two behavioral lockfiles to compare observed capabilities." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Insights</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Compare Behavior</h1>
        <p className="mt-2 text-muted">Compare a baseline lockfile against a candidate observation.</p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="baseline" className="text-sm font-medium">Baseline</label>
            <select id="baseline" value={baselineId} onChange={(e) => setBaselineId(e.target.value)} className="flex h-10 w-full rounded-md border border-line bg-surface px-3 text-sm">
              {lockfiles.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} · v{l.version}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="candidate" className="text-sm font-medium">Candidate</label>
            <select id="candidate" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} className="flex h-10 w-full rounded-md border border-line bg-surface px-3 text-sm">
              {lockfiles.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} · v{l.version}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoApproveNarrower} onChange={(e) => setAutoApproveNarrower(e.target.checked)} className="h-4 w-4 rounded border-line" />
          Auto-approve narrower permission sets
        </label>
        <div className="mt-6">
          <Button onClick={() => void onCompare()} disabled={busy || !baselineId || !candidateId}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <GitCompareArrows className="size-4" />} Run comparison
          </Button>
        </div>
      </div>

      {report ? (
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">Result</h2>
            <Badge variant={report.status === "pass" ? "success" : report.status === "review" ? "warning" : "critical"}>{report.status}</Badge>
          </div>
          {report.comparable ? (
            <>
              {report.addedCount > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-critical">Added capabilities (review required)</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {report.added.map((a, i) => (
                      <li key={i} className="font-mono">
                        + {a.kind} {a.target} (scenario {a.scenario})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {report.removedCount > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted">Removed capabilities</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {report.removed.map((a, i) => (
                      <li key={i} className="font-mono">
                        − {a.kind} {a.target}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {report.addedCount === 0 && report.removedCount === 0 ? <p className="mt-4 text-sm text-muted">No added capabilities detected.</p> : null}
            </>
          ) : (
            <div className="mt-4 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
              <p className="font-semibold">Comparison not comparable</p>
              <ul className="mt-2 list-disc pl-6 text-muted">
                {report.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {error ? <p className="text-sm text-critical">{error}</p> : null}
    </div>
  );
}

function getCsrfToken(): string {
  if (typeof window === "undefined") return "";
  const parts = document.cookie.split(";").map((p) => p.trim()).find((p) => p.startsWith("mcp_lock_csrf="));
  return parts ? parts.split("=").slice(1).join("=") : "";
}
