import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { ShieldCheck, MessageSquare } from "lucide-react";
import { Terminal } from "@/components/icons/brand-icons";

export const metadata: Metadata = {
  title: "Contact — mcp-lock",
  description: "Contact the mcp-lock team for feedback, security reports, and maintainer partnerships.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Get in Touch</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Contact & feedback</h1>
        <p className="mt-4 text-lg text-muted">
          Questions about MCP behavioral observation, maintainer trust badges, or enterprise policies? Reach out directly.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <ContactForm />

        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <ShieldCheck className="size-4 text-primary" /> Responsible Disclosure
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              If you have found a security vulnerability in mcp-lock or a supported tracer backend, please follow our responsible disclosure policy at <code className="font-mono text-[11px]">SECURITY.md</code>. Do not open public GitHub issues for undisclosed vulnerabilities.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Terminal className="size-4 text-signal" /> Community & Code
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              mcp-lock is Apache 2.0 open source. Browse code, inspect tests, and contribute on GitHub.
            </p>
            <div className="mt-4">
              <a
                href="https://github.com/Codexia-afk/mcp_lock"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary hover:underline"
              >
                github.com/Codexia-afk/mcp_lock &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
