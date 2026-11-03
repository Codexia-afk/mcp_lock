import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found — mcp-lock",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Error 404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-md text-muted">The page you are looking for does not exist or has moved.</p>
      <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
        Back to mcp-lock
      </Link>
    </div>
  );
}
