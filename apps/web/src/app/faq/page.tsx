"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  { id: "q1", category: "General", question: "What is mcp-lock?", answer: "mcp-lock is an open-source developer security tool for observing MCP server behavior, recording behavioral baselines, and identifying unexpected changes between observations." },
  { id: "q2", category: "General", question: "What is an MCP server?", answer: "An MCP server exposes tools, resources, or capabilities that AI applications can use through the Model Context Protocol. Depending on its implementation, it may interact with files, databases, external APIs, or other system resources." },
  { id: "q3", category: "General", question: "Why do I need mcp-lock?", answer: "MCP tool descriptions do not necessarily reveal every operating-system operation performed by the server process. mcp-lock provides runtime evidence so developers can make more informed decisions." },
  { id: "q4", category: "General", question: "Does mcp-lock protect against every malicious MCP server?", answer: "No. Dynamic observation only reveals behavior exercised during testing. A malicious or unusual behavior may remain unobserved if triggering conditions are not tested. Actual protection depends on properly configured and verified security boundaries." },
  { id: "q5", category: "General", question: "How is mcp-lock different from a traditional security scanner?", answer: "Many scanners analyze source code, configuration, or declared capabilities. mcp-lock focuses on observed runtime behavior and behavioral differences between executions. It is complementary to other security controls rather than a complete replacement." },
  { id: "q6", category: "General", question: "What is a behavioral lockfile?", answer: "A behavioral lockfile is a structured record of observed operations and relevant execution metadata. Developers can use it as a baseline for later comparisons." },
  { id: "q7", category: "General", question: "How does permission drift detection work?", answer: "mcp-lock compares observations from different executions or package versions and identifies newly observed or changed capabilities. A new operation does not automatically mean the update is malicious, but it provides useful evidence for review." },
  { id: "q8", category: "General", question: "Can beginners use mcp-lock?", answer: "Yes. The project offers understandable reports, documented CLI workflows, and beginner-friendly explanations. Some observation workflows require familiarity with Docker and development tools." },
  { id: "q9", category: "Installation", question: "Does mcp-lock work on macOS?", answer: "Scans on macOS use Linux containers through Docker Desktop. Linux-container observations are not identical to native macOS process observations." },
  { id: "q10", category: "Installation", question: "Does mcp-lock work on Linux?", answer: "Yes, on supported Linux platforms with Docker Engine and the required permissions for the tracing backend." },
  { id: "q11", category: "Installation", question: "Does mcp-lock work on Windows?", answer: "Observations run through WSL2 or Docker Desktop Linux containers. Windows-native kernel observation is not claimed." },
  { id: "q12", category: "Installation", question: "Do I need Docker?", answer: "For existing Docker-based observation workflows, Docker is required unless another supported execution backend exists." },
  { id: "q13", category: "Pricing", question: "Is mcp-lock free?", answer: "The core CLI is open source under the repository license. Hosted platform features, limits, and future paid plans are explained separately." },
  { id: "q14", category: "Security", question: "Does mcp-lock upload my private code?", answer: "Local observation keeps evidence local. Hosted synchronization transmits report metadata and artifacts only when explicitly enabled by the user." },
  { id: "q15", category: "Technical", question: "Can I use mcp-lock with GitHub Actions?", answer: "Yes, through the documented GitHub Action that runs behavioral audits during pull requests or releases." },
  { id: "q16", category: "Technical", question: "What happens when an MCP server update changes its permissions?", answer: "A behavioral comparison can identify newly observed capabilities. Depending on configured policies and CI rules, the change may require review before approval." },
  { id: "q17", category: "Security", question: "Does mcp-lock replace antivirus software or endpoint security?", answer: "No. It addresses understanding and evaluating MCP server runtime behavior and should complement broader security practices." },
  { id: "q18", category: "Technical", question: "What happens if a scan is incomplete?", answer: "Incomplete observations are represented explicitly; the interface never presents an incomplete scan as proof of safety." },
  { id: "q19", category: "Open Source", question: "Can I contribute to mcp-lock?", answer: "Yes. Contributions should preserve honest security claims, fail-closed behavior, and the separation of evidence from enforcement." },
  { id: "q20", category: "Security", question: "How can I report a security vulnerability?", answer: "Use the responsible disclosure process documented in the repository security policy. Do not file public GitHub issues for security vulnerabilities." },
  { id: "q21", category: "Technical", question: "What exit codes does the CLI use?", answer: "0 pass, 2 review required, 3 usage error, 4 incomplete evidence, 5 fail closed, 6 scenario or observation failure, 7 output write failure." },
  { id: "q22", category: "Troubleshooting", question: "Why did the release gate fail?", answer: "The gate fails when behavior changed without approved policy, when evidence is incomplete, or when the environment differs from the baseline." },
];

const CATEGORIES = ["All", "General", "Installation", "Security", "Technical", "Pricing", "Open Source", "Troubleshooting"] as const;

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [openId, setOpenId] = useState<string | undefined>(undefined);

  const filtered = useMemo(
    () =>
      FAQ_ITEMS.filter((item) => {
        const matchesCategory = category === "All" || item.category === category;
        const matchesQuery = query.trim() === "" || `${item.question} ${item.answer}`.toLowerCase().includes(query.trim().toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [query, category],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">FAQ</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Frequently asked questions</h1>
      <p className="mt-4 text-lg text-muted">Accurate answers about behavior, security, installation, and pricing.</p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="h-11 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            aria-label="Search frequently asked questions"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="FAQ categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${category === c ? "border-primary bg-primary text-white" : "border-line bg-surface text-muted hover:text-ink"}`}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">No questions matched your search.</p>
        ) : (
          filtered.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id} className="rounded-xl border border-line bg-surface shadow-sm">
                <button
                  type="button"
                  id={`faq-trigger-${item.id}`}
                  aria-expanded={open}
                  aria-controls={`faq-panel-${item.id}`}
                  onClick={() => setOpenId(open ? undefined : item.id)}
                  className="flex w-full items-center justify-between gap-4 py-4 px-5 text-left text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex-1">{item.question}</span>
                  <Badge variant="neutral">{item.category}</Badge>
                  <span aria-hidden="true" className="text-muted">▾</span>
                </button>
                {open ? (
                  <div id={`faq-panel-${item.id}`} role="region" aria-labelledby={`faq-trigger-${item.id}`} className="px-5 pb-5 pr-8 text-sm text-muted">
                    {item.answer}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
