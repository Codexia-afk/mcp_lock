"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Menu, X } from "lucide-react";

const sections = [
  {
    title: "Introduction",
    items: [
      { label: "Overview", href: "/docs" },
      { label: "Quick Start", href: "/docs/quickstart" },
    ],
  },
  {
    title: "Installation",
    items: [
      { label: "Installation Overview", href: "/docs/install" },
      { label: "macOS Setup", href: "/docs/macos" },
      { label: "Linux Setup", href: "/docs/linux" },
      { label: "Windows Setup", href: "/docs/windows" },
    ],
  },
  {
    title: "Your First Scan",
    items: [{ label: "Your First Scan", href: "/docs/first-scan" }],
  },
  {
    title: "Understanding Evidence",
    items: [
      { label: "Behavior Lockfiles", href: "/docs/lockfiles" },
      { label: "Permission Changes", href: "/docs/permission-changes" },
      { label: "Scenario Generation", href: "/docs/scenarios" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "CLI Commands", href: "/docs/cli" },
      { label: "Policy Assessment", href: "/docs/policy" },
      { label: "CI/CD Integration", href: "/docs/cicd" },
      { label: "Troubleshooting", href: "/docs/troubleshooting" },
      { label: "Security Model", href: "/docs/security" },
      { label: "Contributing", href: "/docs/contributing" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-4 sm:px-6 lg:px-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 pt-8">
          <Link href="/docs" className="flex items-center gap-2 text-sm font-semibold text-ink">
            <BookOpen className="size-4 text-primary" aria-hidden="true" /> mcp-lock Docs
          </Link>
          <nav className="mt-6 space-y-6" aria-label="Documentation">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{section.title}</p>
                <ul className="mt-2 space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${isActive(item.href) ? "bg-inset font-semibold text-ink" : "text-muted hover:bg-inset hover:text-ink"}`}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink lg:hidden"
          aria-expanded={mobileOpen}
        >
          <Menu className="size-4" /> Docs menu
        </button>
        {mobileOpen ? (
          <div className="mt-3 rounded-xl border border-line bg-surface p-4 lg:hidden">
            <nav className="space-y-4" aria-label="Documentation mobile">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{section.title}</p>
                  <ul className="mt-2 space-y-1.5">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} className="block rounded-md px-3 py-1.5 text-sm text-muted hover:bg-inset hover:text-ink" onClick={() => setMobileOpen(false)}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <button type="button" onClick={() => setMobileOpen(false)} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <X className="size-4" /> Close menu
            </button>
          </div>
        ) : null}
        <div className="pb-24">{children}</div>
      </div>
    </div>
  );
}
