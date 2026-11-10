"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function SampleWorkspaceButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onLoad = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sample-workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
      const data = (await res.json().catch(() => null)) as { workspaceId?: string; error?: { message?: string } };
      if (!res.ok) {
        setError(data?.error?.message ?? "Could not load sample workspace");
        return;
      }
      router.push(`/app?workspaceId=${data.workspaceId ?? ""}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={onLoad} disabled={busy} className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-inset disabled:opacity-50">
      {busy ? "Loading sample workspace…" : "Load sample workspace"}
    </button>
  );
}
