"use client";

import * as React from "react";
import Link from "next/link";
import { Github } from "@/components/icons/brand-icons";
import { BrandBadge } from "@/components/brand/brand-badge";

export function SiteFooter() {
  const [year] = React.useState(() => new Date().getFullYear());

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandBadge size="md" />
              <span className="text-lg font-bold tracking-tight text-ink">mcp-lock</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted">
              Behavioral evidence, reviewed permission lockfiles, and author-side trust for Model Context Protocol (MCP) servers.
            </p>
            <a
              href="https://github.com/Codexia-afk/mcp_lock"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Github className="size-4" aria-hidden="true" /> View source on GitHub
            </a>
          </div>
          <nav aria-label="Product">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Product</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/product" className="text-ink hover:text-primary">Product overview</Link></li>
              <li><Link href="/features" className="text-ink hover:text-primary">Features</Link></li>
              <li><Link href="/how-it-works" className="text-ink hover:text-primary">How it works</Link></li>
              <li><Link href="/security" className="text-ink hover:text-primary">Security model</Link></li>
              <li><Link href="/pricing" className="text-ink hover:text-primary">Pricing</Link></li>
            </ul>
          </nav>
          <nav aria-label="Resources">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Resources</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/docs" className="text-ink hover:text-primary">Documentation</Link></li>
              <li><Link href="/install" className="text-ink hover:text-primary">Installation</Link></li>
              <li><Link href="/integrations" className="text-ink hover:text-primary">Integrations</Link></li>
              <li><Link href="/changelog" className="text-ink hover:text-primary">Changelog</Link></li>
              <li><Link href="/faq" className="text-ink hover:text-primary">FAQ</Link></li>
            </ul>
          </nav>
          <nav aria-label="Company">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="text-ink hover:text-primary">About</Link></li>
              <li><Link href="/contact" className="text-ink hover:text-primary">Contact</Link></li>
              <li><a href="https://github.com/Codexia-afk/mcp_lock/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-ink hover:text-primary">License (Apache 2.0)</a></li>
              <li><a href="https://github.com/Codexia-afk/mcp_lock/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" className="text-ink hover:text-primary">Security Policy</a></li>
            </ul>
          </nav>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row text-xs text-muted">
          <p>© {year} mcp-lock contributors. Built for the Model Context Protocol ecosystem.</p>
          <p className="font-mono text-[11px]">Fail-closed security: exit codes 0, 2, 3, 4, 5.</p>
        </div>
      </div>
    </footer>
  );
}
