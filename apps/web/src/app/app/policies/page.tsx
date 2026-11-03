"use client";

import * as React from "react";
import { ShieldCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

interface Policy {
  id: string;
  status: "proposed" | "approved";
  serverImageDigest: string;
  evidenceDigest: string;
  files: Array<{ path: string; access: string }>;
  network: Array<{ host: string; port: number }>;
  executables: Array<{ path: string; digest?: string }>;
  requiredControls: string[];
  reviewRequired?: string[];
  approvedBy?: string;
}

interface AssessmentResult {
  assessment: { identityChanged: boolean; unapproved: Array<{ kind: string; target: string; outcome: string; scenario: string; count: number }> };
  policy: Policy;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = React.useState<Policy[]>([]);
  const [lockfiles, setLockfiles] = React.useState<Array<{ id: string; version: string; data: { evidenceDigest: string; server: { imageDigest: string } } }>>([]);
  const [selectedPolicyId, setSelectedPolicyId] = React.useState<string>("");
  const [assessment, setAssessment] = React.useState<AssessmentResult | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const [policiesRes, lockfilesRes] = await Promise.all([
      fetch("/api/policies"),
      fetch("/api/lockfiles"),
    ]);
    const policiesData = (await policiesRes.json()) as { policies?: Policy[] };
    const lockfilesData = (await lockfilesRes.json()) as { lockfiles?: Array<{ id: string; version: string; data: { evidenceDigest: string; server: { imageDigest: string } } }> };
    setPolicies(policiesData.policies ?? []);
    setLockfiles(lockfilesData.lockfiles ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onPropose = async (lockfileId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/policies/propose", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ lockfileId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string }; policy?: Policy };
      if (!res.ok) {
        setError(data?.error?.message ?? "Could not propose policy");
        return;
      }
      setSelectedPolicyId(data.policy?.id ?? "");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onAssess = async (policyId: string, scanId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/policies/${policyId}/assess`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ scanId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string }; assessment?: AssessmentResult };
      if (!res.ok) {
        setError(data?.error?.message ?? "Assessment failed");
        return;
      }
      setAssessment(data.assessment ?? null);
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async (policy: Policy) => {
    const approvedBy = window.prompt("Approving reviewer identity (e.g. security@example.com)", "security-reviewer@example.com");
    if (!approvedBy) return;
    const res = await fetch(`/api/policies/${policy.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-csrf-token": getCsrfToken() },
      body: JSON.stringify({ ...policy, status: "approved", approvedBy }),
    });
    if (res.ok) {
      await load();
    }
  };

  if (policies.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Insights</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Policies</h1>
        </div>
        <EmptyState title="No policies yet" description="Propose a policy from a behavioral lockfile to start reviewing assessments." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Insights</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Policies</h1>
        <p className="mt-2 text-muted">Reviewed permission policies and assessments.</p>
      </div>

      <div className="space-y-3">
        {policies.map((p) => (
          <div key={p.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <p className="font-mono text-sm font-semibold">{p.id}</p>
              <Badge variant={p.status === "approved" ? "success" : "warning"}>{p.status}</Badge>
            </div>
            <p className="mt-2 font-mono text-xs text-muted">server: {p.serverImageDigest}</p>
            <p className="mt-2 text-sm text-muted">{p.files.length} file rules · {p.network.length} network rules · {p.executables.length} executable rules</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void onPropose(lockfiles[0]?.id ?? "")}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Propose from lockfile
              </Button>
              {p.status === "proposed" ? (
                <Button size="sm" onClick={() => void onApprove(p)}>
                  Approve
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {assessment ? (
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Latest assessment</h2>
          <p className="mt-2 text-sm text-muted">Identity changed: {assessment.assessment.identityChanged ? "Yes" : "No"}</p>
          {assessment.assessment.unapproved.length > 0 ? (
            <div className="mt-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-critical">
                <XCircle className="size-4" /> Unapproved operations
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {assessment.assessment.unapproved.map((u, i) => (
                  <li key={i} className="font-mono">
                    {u.kind} {u.target} (scenario {u.scenario})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-signal">
              <CheckCircle2 className="size-4" /> No unapproved operations detected.
            </p>
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
