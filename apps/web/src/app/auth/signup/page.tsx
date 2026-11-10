"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field, Label } from "@/components/ui/input";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
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
      const res = await fetch("/api/auth/signup/email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | { ok?: boolean };
      if (!res.ok) {
        setError(data && "error" in data ? data.error?.message ?? "Sign-up failed" : "Sign-up failed");
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
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted">Start organizing behavioral evidence for your MCP servers.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field>
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted">At least 8 characters.</p>
          </Field>
          {error ? <p className="text-sm text-critical">{error}</p> : null}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
