"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function WaitlistForm() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, source: "pricing" }),
    });
    if (!res.ok) {
      setError("Could not save your request. Please try again.");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return <p className="mt-4 rounded-lg bg-signal/10 px-4 py-3 text-sm font-medium text-[#2f7a1e]">Thanks — your waitlist request was saved.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="h-11 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        aria-label="Email address for waitlist"
      />
      <Button type="submit">Join waitlist</Button>
      {error ? <p className="text-sm text-critical">{error}</p> : null}
    </form>
  );
}

