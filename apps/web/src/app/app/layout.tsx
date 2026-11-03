import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, FolderKanban, Server, ScanLine, FileLock2, GitCompareArrows, ShieldCheck, Activity as ActivityIcon, Settings, Users } from "lucide-react";
import { BrandBadge } from "@/components/brand/brand-badge";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SignOutButton } from "@/components/app/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NAV = [
  { group: "Overview", items: [{ label: "Overview", href: "/app", icon: LayoutDashboard }] },
  { group: "Workspace", items: [{ label: "Projects", href: "/app/projects", icon: FolderKanban }, { label: "MCP Servers", href: "/app/servers", icon: Server }, { label: "Scans", href: "/app/scans", icon: ScanLine }] },
  { group: "Insights", items: [{ label: "Behavior Lockfiles", href: "/app/lockfiles", icon: FileLock2 }, { label: "Compare", href: "/app/compare", icon: GitCompareArrows }, { label: "Policies", href: "/app/policies", icon: ShieldCheck }, { label: "Activity", href: "/app/activity", icon: ActivityIcon }] },
  { group: "Administration", items: [{ label: "Settings", href: "/app/settings", icon: Settings }, { label: "Team", href: "/app/team", icon: Users }] },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser({ headers: await headers() });
  if (!session) {
    redirect("/auth/signin");
  }
  const db = getDb();
  const user = db.prepare("SELECT id, name, email, email_verified AS emailVerified, image, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?").get(session.userId) as any;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
          <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
            <BrandBadge size="md" />
            <span className="text-lg font-bold tracking-tight text-ink transition-colors duration-200">mcp-lock</span>
            <span className="ml-auto rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-muted">SaaS beta</span>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Application">
            {NAV.map((group) => (
              <div key={group.group} className="mb-6">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">{group.group}</p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-inset hover:text-ink">
                        <item.icon className="size-4" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
              <Link href="/app" className="flex items-center gap-2 lg:hidden" aria-label="mcp-lock home">
                <BrandBadge size="sm" />
                <span className="text-base font-bold tracking-tight text-ink">mcp-lock</span>
              </Link>
              <p className="text-sm font-semibold text-muted">Developer workspace</p>
              <div className="ml-auto flex items-center gap-3">
                <Link href="/docs" className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink sm:inline-block">Docs</Link>
                <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5">
                  <span className="text-xs font-semibold text-ink">{user?.name ?? "Developer"}</span>
                  <span className="max-w-[140px] truncate text-xs text-muted">{user?.email}</span>
                </div>
                <ThemeToggle />
                <SignOutButton />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
