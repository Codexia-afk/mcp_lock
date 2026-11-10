"use client";

import * as React from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [name, setName] = React.useState("");
  const [created, setCreated] = React.useState<{ key: string; record: ApiKey } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/api-keys");
    const data = (await res.json()) as { keys?: ApiKey[] };
    setKeys(data.keys ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": getCsrfToken() },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => null)) as { key?: string; error?: { message?: string } };
      if (!res.ok) {
        setError(data?.error?.message ?? "Could not create key");
        return;
      }
      setCreated({ key: data.key ?? "", record: data.key ? { id: "", name, keyPrefix: data.key.slice(0, 12), lastUsedAt: undefined, revokedAt: undefined, createdAt: "" } : { id: "", name, keyPrefix: "", lastUsedAt: undefined, revokedAt: undefined, createdAt: "" } });
      setName("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (id: string) => {
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Administration</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="mt-2 text-muted">Scoped credentials for authenticated scan ingestion.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={onCreate} className="flex flex-col gap-3 sm:flex-row">
            <Field>
              <Label htmlFor="key-name">Key name</Label>
              <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ci-production" required />
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={busy}>
                <Plus className="size-4" /> Create key
              </Button>
            </div>
          </form>
          {error ? <p className="mt-3 text-sm text-critical">{error}</p> : null}
        </CardContent>
      </Card>

      {created ? (
        <div className="rounded-xl border border-warning/40 bg-warning-soft p-5">
          <p className="text-sm font-semibold">Copy this key now — it will not be shown again.</p>
          <code className="mt-2 block rounded-lg bg-surface p-3 font-mono text-xs break-all">{created.key}</code>
        </div>
      ) : null}

      {keys.length === 0 ? (
        <EmptyState title="No API keys" description="Create a key to authenticate scan ingestion." />
      ) : (
        <div className="rounded-xl border border-line bg-surface shadow-sm">
          <ul className="divide-y divide-line">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <KeyRound className="size-4 text-primary" aria-hidden="true" />
                <span className="font-medium">{k.name}</span>
                <code className="rounded bg-inset px-2 py-0.5 font-mono text-xs">{k.keyPrefix}…</code>
                <span className="text-xs text-muted">created {new Date(k.createdAt).toISOString()}</span>
                {k.revokedAt ? <span className="rounded-full border border-critical/40 bg-critical-soft px-2 py-0.5 text-xs font-medium text-critical">revoked</span> : null}
                <button type="button" className="ml-auto rounded-md border border-line p-2 text-muted hover:text-critical" onClick={() => void onRevoke(k.id)} aria-label={`Revoke key ${k.name}`}>
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function getCsrfToken(): string {
  if (typeof window === "undefined") return "";
  const parts = document.cookie.split(";").map((p) => p.trim()).find((p) => p.startsWith("mcp_lock_csrf="));
  return parts ? parts.split("=").slice(1).join("=") : "";
}
