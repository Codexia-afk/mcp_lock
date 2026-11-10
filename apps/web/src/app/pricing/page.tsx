import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "@/components/pricing/waitlist-form";

export const metadata: Metadata = {
  title: "Pricing — mcp-lock",
  description: "mcp-lock open-source pricing: free CLI license, hosted workspace options, and planned team capabilities.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Pricing</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Pricing that respects open source</h1>
        <p className="mt-4 text-lg text-muted">The behavioral engine is free and open source under Apache 2.0. Paid offerings cover hosted workflows and team review capabilities.</p>
      </header>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <PricingCard
          name="Open Source"
          price="Free"
          tagline="The complete CLI and engine."
          features={["Local behavioral observation", "Behavioral lockfiles", "CLI comparisons", "Policy assessment", "Documentation", "Community support"]}
          cta={{ label: "View source", href: "https://github.com/Codexia-afk/mcp_lock" }}
        />
        <PricingCard
          name="Hosted Developer Workspace"
          price="Coming soon"
          tagline="Organize scans and baselines in the cloud."
          features={["Scan storage", "Behavioral lockfile review", "Policy workspaces", "Team collaboration (planned)"]}
          cta={{ label: "Join the waitlist", href: "/#waitlist" }}
          featured
        />
        <PricingCard
          name="Teams"
          price="Planned"
          tagline="Shared baselines, approvals, and alerts."
          features={["Shared baselines", "Organization approvals", "Centralized inventories", "Compliance-oriented exports (planned)"]}
          cta={{ label: "Talk to us", href: "/contact" }}
        />
      </div>

      <div className="mt-12 rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Hosted workspace waitlist</h2>
        <p className="mt-2 text-muted">Hosted scanning and storage are in development. Join the waitlist and we will save your submission.</p>
        <WaitlistForm />
      </div>

      <div className="mt-12 text-sm text-muted">
        <p>
          Billing infrastructure for hosted plans is not yet available. Paid plans will be introduced only with legitimate
          entitlement and payment-provider verification. Read the <Link className="text-primary hover:underline" href="/pricing">pricing page</Link> for details.
        </p>
      </div>
    </div>
  );
}

function PricingCard({ name, price, tagline, features, cta, featured }: { name: string; price: string; tagline: string; features: string[]; cta: { label: string; href: string }; featured?: boolean }) {
  return (
    <div className={`relative rounded-xl border bg-surface p-6 shadow-sm ${featured ? "border-primary ring-2 ring-primary/30" : "border-line"}`}>
      {featured ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">Most requested</span> : null}
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="mt-1 text-3xl font-bold tracking-tight">{price}</p>
      <p className="mt-1 text-sm text-muted">{tagline}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-signal" aria-hidden="true">✓</span> {f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <a href={cta.href} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">
          {cta.label}
        </a>
      </div>
    </div>
  );
}
