"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { Input, Field, Label } from "@/components/ui/input";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
      const res = await fetch("/api/auth/signin/email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | { ok?: boolean };
      if (!res.ok) {
        setError(data && "error" in data ? data.error?.message ?? "Sign-in failed" : "Sign-in failed");
        return;
      }
      router.push("/app");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-xl border border-line bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Sign in to mcp-lock</h1>
        <p className="mt-2 text-sm text-muted">Access your behavioral scan workspace.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error ? <p className="text-sm text-critical">{error}</p> : null}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="mt-4">
          <a
            href="/api/auth/signin/github"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface text-sm font-medium text-ink transition-colors hover:bg-inset"
          >
            <Github className="size-4" /> Continue with GitHub
          </a>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Need an account?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
