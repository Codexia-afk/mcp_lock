import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works — mcp-lock",
  description: "The technical workflow from MCP server selection through controlled execution, observation, lockfile generation, diffing, policy review, and CI integration.",
};

export default function HowItWorksPage() {
  const steps = [
    { n: "01", title: "Select your MCP server", body: "Choose a local executable, supported package command, or configured server." },
    { n: "02", title: "Create a controlled environment", body: "mcp-lock prepares a restricted execution environment with isolation controls." },
    { n: "03", title: "Execute test scenarios", body: "The runner communicates with the MCP server and exercises supported tools." },
    { n: "04", title: "Observe behavior", body: "Runtime events are captured and normalized." },
    { n: "05", title: "Generate evidence", body: "A versioned behavioral record is created." },
    { n: "06", title: "Review permissions", body: "Observed capabilities and policy assessment are presented." },
    { n: "07", title: "Compare future versions", body: "Newly observed or expanded behavior is flagged." },
    { n: "08", title: "Integrate with CI/CD", body: "Approved baselines evaluate updates." },
  ];

  return (
    <div className="max-w-5xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">How it works</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">From untrusted server to reviewed baseline</h1>
      <p className="mt-4 max-w-3xl text-lg text-muted">The workflow mirrors a dependency lockfile, but records observed runtime behavior instead of package versions.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {steps.map((s) => (
          <div key={s.n} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <p className="font-mono text-xs text-primary">{s.n}</p>
            <h2 className="mt-2 text-base font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">What mcp-lock cannot guarantee</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-muted">
          <li>Dynamic tests cannot establish the absence of hidden behavior.</li>
          <li>Coverage depends on executed scenarios.</li>
          <li>Some operations may be unobservable.</li>
          <li>Behavior may differ outside the test environment.</li>
          <li>Trace loss or incomplete execution reduces confidence.</li>
          <li>Policy assessment is not automatically runtime enforcement.</li>
        </ul>
      </div>

      <div className="mt-10">
        <Link href="/how-it-works" className="text-sm font-semibold text-primary hover:underline">Continue to the full workflow →</Link>
      </div>
    </div>
  );
}
