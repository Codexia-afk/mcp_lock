import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ScanLine, Server as ServerIcon, FileLock2, ShieldCheck, FolderKanban, ArrowRight } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listLockfiles, listPolicies, listProjects, listScans, listServers, listWorkspacesForUser } from "@/lib/queries";
import { SampleWorkspaceButton } from "@/components/app/sample-workspace-button";

export default async function AppOverviewPage() {
  const session = await getSessionUser({ headers: await headers() });
  if (!session) {
    redirect("/auth/signin");
  }
  const db = getDb();
  const user = db.prepare("SELECT id, name, email, email_verified AS emailVerified, image, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?").get(session.userId) as any;
  const workspaces = listWorkspacesForUser(user.id);
  const workspaceId = workspaces[0]?.id;
  const projects = workspaceId ? listProjects(workspaceId) : [];
  const servers = workspaceId ? listServers(workspaceId) : [];
  const scans = workspaceId ? listScans(undefined, 5, 0) : [];
  const lockfiles = workspaceId ? listLockfiles() : [];
  const policies = workspaceId ? listPolicies(workspaceId) : [];

  const pendingReviews = policies.filter((p) => p.status === "proposed").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(" ")[0] ?? "developer"}</h1>
        </div>
        <Link href="/app/servers" className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
          <ServerIcon className="size-4" /> Register an MCP server
        </Link>
      </div>

      {projects.length === 0 && servers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface/70 p-10 text-center">
          <h2 className="text-xl font-semibold">Your workspace is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Create a project, register an MCP server, and upload or generate a behavioral lockfile. Prefer to explore first? Load the labeled sample workspace.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/app/projects?new=1" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">Create project</Link>
            <SampleWorkspaceButton />
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} label="Projects" value={projects.length} href="/app/projects" />
        <StatCard icon={ServerIcon} label="Tracked MCP servers" value={servers.length} href="/app/servers" />
        <StatCard icon={ScanLine} label="Scans" value={scans.length} href="/app/scans" />
        <StatCard icon={FileLock2} label="Behavioral lockfiles" value={lockfiles.length} href="/app/lockfiles" />
        <StatCard icon={ShieldCheck} label="Open policy reviews" value={pendingReviews} href="/app/policies" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent scans</h2>
            <Link href="/app/scans" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          {scans.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No scans yet. Run your first observation to build a baseline.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {scans.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-mono text-sm font-medium">{s.id}</p>
                    <p className="text-xs text-muted">{s.startedAt}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.status === "completed" ? "border-signal/40 bg-signal/10 text-[#2f7a1e]" : "border-warning/40 bg-warning-soft text-[#92610f]"}`}>{s.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Getting started</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-6 text-sm text-muted">
            <li>Install and verify the CLI.</li>
            <li>Register an MCP server in this workspace.</li>
            <li>Upload a behavior.lock or run a local scan.</li>
            <li>Compare versions and assess policies.</li>
          </ol>
          <Link href="/install" className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">Install mcp-lock</Link>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, href }: { icon: any; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </Link>
  );
}
