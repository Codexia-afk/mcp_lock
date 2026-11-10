"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

interface Server {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  packageName?: string;
  version?: string;
  source?: string;
  imageDigest?: string;
  registeredAt: string;
  lastScannedAt?: string;
}

function ServersContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") ?? "";
  const [servers, setServers] = React.useState<Server[]>([]);
  const [projects, setProjects] = React.useState<Array<{ id: string; name: string }>>([]);
  const [name, setName] = React.useState("");
  const [packageName, setPackageName] = React.useState("");
  const [version, setVersion] = React.useState("");
  const [source, setSource] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!workspaceId) return;
    const [serversRes, projectsRes] = await Promise.all([
      fetch(`/api/servers?workspaceId=${encodeURIComponent(workspaceId)}`),
      fetch(`/api/projects?workspaceId=${encodeURIComponent(workspaceId)}`),
    ]);
    const serversData = (await serversRes.json()) as { servers?: Server[] };
    const projectsData = (await projectsRes.json()) as { projects?: Array<{ id: string; name: string }> };
    setServers(serversData.servers ?? []);
    setProjects(projectsData.projects ?? []);
  }, [workspaceId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ name, packageName, version, source, projectId }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string }; server?: Server };
      if (!res.ok) {
        setError(data?.error?.message ?? "Could not register server");
        return;
      }
      setName("");
      setPackageName("");
      setVersion("");
      setSource("");
      setProjectId("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/servers/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  const firstProjectId = projects[0]?.id ?? "";

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">MCP Servers</h1>
        <p className="mt-2 text-muted">Register and track MCP server baselines.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register an MCP server</CardTitle>
          <CardDescription>Pinned server identity used for behavioral baselines.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="server-name">Server name</Label>
              <Input id="server-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="mcp-server-echo" required />
            </Field>
            <Field>
              <Label htmlFor="server-pkg">npm / PyPI package</Label>
              <Input id="server-pkg" value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="@example/mcp-server-echo" />
            </Field>
            <Field>
              <Label htmlFor="server-version">Version</Label>
              <Input id="server-version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" />
            </Field>
            <Field>
              <Label htmlFor="server-source">Source</Label>
              <Input id="server-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="npm" />
            </Field>
            <Field>
              <Label htmlFor="server-project">Project</Label>
              <select id="server-project" value={projectId || firstProjectId} onChange={(e) => setProjectId(e.target.value)} className="flex h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink">
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={busy}>
                <Plus className="size-4" /> Register server
              </Button>
            </div>
          </form>
          {error ? <p className="mt-3 text-sm text-critical">{error}</p> : null}
        </CardContent>
      </Card>

      {servers.length === 0 ? (
        <EmptyState title="No MCP servers registered" description="Register a server to start recording behavioral baselines." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Package</th>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Last scan</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted">{s.packageName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{s.version ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{s.lastScannedAt ? new Date(s.lastScannedAt).toISOString().slice(0, 10) : "Never"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => void onDelete(s.id)} aria-label={`Delete server ${s.name}`}>
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {servers.length > 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <ScanLine className="size-4" /> Scans run through the local mcp-lock CLI; results can be uploaded from <code className="font-mono">behavior.lock</code> files.
        </div>
      ) : null}
    </div>
  );
}

export default function ServersPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-sm text-muted">Loading servers...</div>}>
      <ServersContent />
    </React.Suspense>
  );
}

function getCsrfToken(): string {
  if (typeof window === "undefined") return "";
  const parts = document.cookie.split(";").map((p) => p.trim()).find((p) => p.startsWith("mcp_lock_csrf="));
  return parts ? parts.split("=").slice(1).join("=") : "";
}
