"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Github } from "@/components/icons/brand-icons";
import { BrandBadge } from "@/components/brand/brand-badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Product", href: "/product" },
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Security", href: "/security" },
  { label: "Install", href: "/install" },
  { label: "Docs", href: "/docs" },
  { label: "FAQ", href: "/faq" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90" aria-label="mcp-lock home">
          <BrandBadge size="md" />
          <span className="text-lg font-bold tracking-tight text-ink transition-colors duration-200">mcp-lock</span>
        </Link>

        <nav className="ml-8 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-inset text-ink" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com/Codexia-afk/mcp_lock"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-inset sm:inline-flex"
          >
            <Github className="size-4" aria-hidden="true" />
            <span className="hidden md:inline">GitHub</span>
          </a>
          <Link
            href="/install"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink md:inline-block"
          >
            Install
          </Link>
          <Link
            href="/pricing"
            className="hidden rounded-md px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover sm:inline-block"
          >
            Get Started
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md border border-line bg-surface text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-line bg-canvas px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-inset hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/pricing"
              className="mt-2 rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Get Started
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
