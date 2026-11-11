"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

function ProjectsContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") ?? "";
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!workspaceId) return;
    const res = await fetch(`/api/projects?workspaceId=${encodeURIComponent(workspaceId)}`);
    const data = (await res.json()) as { projects?: Project[] };
    setProjects(data.projects ?? []);
  }, [workspaceId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ name, description }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string }; project?: Project };
      if (!res.ok) {
        setError(data?.error?.message ?? "Could not create project");
        return;
      }
      setName("");
      setDescription("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json", "x-csrf-token": getCsrfToken() },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      await load();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Projects</h1>
        <p className="mt-2 text-muted">Group MCP servers and their behavioral baselines.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Field>
              <Label htmlFor="project-name">Project name</Label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="my-ai-product" required />
            </Field>
            <Field>
              <Label htmlFor="project-desc">Description</Label>
              <Input id="project-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={busy}>
                <Plus className="size-4" /> Create project
              </Button>
            </div>
          </form>
          {error ? <p className="mt-3 text-sm text-critical">{error}</p> : null}
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Create your first project to start organizing MCP server baselines." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted">{p.description ?? "—"}</TableCell>
                    <TableCell className="text-muted">{p.createdAt.slice(0, 10)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => void onDelete(p.id)} aria-label={`Delete project ${p.name}`}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-sm text-muted">Loading projects...</div>}>
      <ProjectsContent />
    </React.Suspense>
  );
}

function getCsrfToken(): string {
  if (typeof window === "undefined") return "";
  const parts = document.cookie.split(";").map((p) => p.trim()).find((p) => p.startsWith("mcp_lock_csrf="));
  return parts ? parts.split("=").slice(1).join("=") : "";
}
