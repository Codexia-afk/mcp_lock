"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Send, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("maintainer-inquiry");
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          source: `contact:${subject}:${name}`,
        }),
      });
      if (!res.ok) {
        setError("Failed to send message. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-10 text-signal" />
        <h3 className="mt-3 text-lg font-bold">Message sent</h3>
        <p className="mt-1 text-sm text-muted">
          Thank you for reaching out. We will review your message and respond shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-line bg-surface p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@example.com"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">Topic</Label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-10 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary"
        >
          <option value="maintainer-inquiry">MCP Maintainer Integration / Badge</option>
          <option value="enterprise-security">Enterprise Team & Policy Inquiries</option>
          <option value="bug-report">CLI Bug / Syscall Normalization Report</option>
          <option value="general-feedback">General Feedback</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your MCP server or team's security requirements..."
        />
      </div>

      {error ? <p className="text-xs font-semibold text-critical">{error}</p> : null}

      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        <Send className="size-4" /> {busy ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

