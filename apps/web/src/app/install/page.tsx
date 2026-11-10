import type { Metadata } from "next";
import { InstallTabs } from "@/components/install/install-tabs";

export const metadata: Metadata = {
  title: "Installation — mcp-lock",
  description: "Install mcp-lock on macOS, Linux, or Windows, verify the environment, run an example scan, and generate a behavioral lockfile.",
};

const CHECKLIST_STEPS = [
  { id: "prerequisites", label: "Install prerequisites" },
  { id: "install", label: "Install mcp-lock" },
  { id: "verify", label: "Verify environment" },
  { id: "example", label: "Run an example" },
  { id: "lockfile", label: "Generate a behavioral lockfile" },
  { id: "review", label: "Review your results" },
] as const;

export default function InstallPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Installation</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Install mcp-lock</h1>
        <p className="mt-4 text-lg text-muted">
          Install the Go CLI, verify the Linux container observation backend, and generate your first behavioral lockfile.
        </p>
      </header>

      <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CHECKLIST_STEPS.map((step, i) => (
          <li key={step.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-inset font-mono text-xs font-semibold text-primary">{i + 1}</span>
            <div>
              <p className="text-sm font-semibold">{step.label}</p>
              <p className="mt-1 font-mono text-xs text-muted">{step.id}</p>
            </div>
          </li>
        ))}
      </ol>

      <InstallTabs />
    </div>
  );
}
