import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = {
  title: {
    default: "mcp-lock — Know what your AI tools actually do",
    template: "%s — mcp-lock",
  },
  description:
    "mcp-lock is an open-source behavioral lockfile for MCP servers. It observes runtime OS behavior, records permissions, and helps developers catch unexpected changes before trusting an AI tool update.",
  keywords: [
    "MCP security",
    "Model Context Protocol",
    "behavioral lockfile",
    "runtime security",
    "MCP server safety",
    "AI tool permissions",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    siteName: "mcp-lock",
    title: "mcp-lock — Know what your AI tools actually do",
    description:
      "Behavioral evidence, reviewed permission lockfiles, and author-side trust for Model Context Protocol (MCP) servers.",
    locale: "en_US",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "mcp-lock — Know what your AI tools actually do",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "mcp-lock — Know what your AI tools actually do",
    description:
      "The behavioral lockfile for MCP servers. Observe runtime behavior, record permissions, catch unexpected changes.",
    images: ["/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased bg-canvas text-ink transition-colors duration-150">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:mr-4 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
