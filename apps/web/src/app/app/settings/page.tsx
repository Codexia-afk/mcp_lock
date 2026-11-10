import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ThemeSegmented } from "@/components/theme/theme-toggle";

export const metadata = {
  title: "Settings — mcp-lock SaaS",
};

export default async function SettingsPage() {
  const session = await getSessionUser({ headers: await headers() });
  if (!session) {
    redirect("/auth/signin");
  }
  const db = getDb();
  const user = db
    .prepare(
      "SELECT id, name, email, email_verified AS emailVerified, image, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?",
    )
    .get(session.userId) as any;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Administration</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Manage your account profile, preferences, and workspace appearance.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-muted">
          Customize how mcp-lock looks on your device. By default, it automatically adapts to your
          operating system settings.
        </p>
        <div className="mt-6">
          <ThemeSegmented />
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted">Name</dt>
            <dd className="text-sm font-medium text-ink">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Email</dt>
            <dd className="text-sm font-medium text-ink">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Email verified</dt>
            <dd className="text-sm font-medium text-ink">{user?.emailVerified ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">User ID</dt>
            <dd className="font-mono text-sm text-ink">{user?.id}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
