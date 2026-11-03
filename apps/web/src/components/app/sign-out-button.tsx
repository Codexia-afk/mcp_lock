"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const onSignOut = async () => {
    setBusy(true);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({}),
      });
    } finally {
      router.push("/auth/signin");
      router.refresh();
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={onSignOut} disabled={busy} className="inline-flex h-9 items-center rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-inset disabled:opacity-50">
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
