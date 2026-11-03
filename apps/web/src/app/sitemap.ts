import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paths = [
    "/",
    "/product",
    "/features",
    "/how-it-works",
    "/security",
    "/install",
    "/docs",
    "/docs/cli",
    "/docs/quickstart",
    "/docs/first-scan",
    "/docs/lockfiles",
    "/docs/permission-changes",
    "/docs/scenarios",
    "/docs/policy",
    "/docs/cicd",
    "/docs/troubleshooting",
    "/docs/security",
    "/docs/contributing",
    "/docs/install",
    "/docs/macos",
    "/docs/linux",
    "/docs/windows",
    "/integrations",
    "/changelog",
    "/faq",
    "/about",
    "/contact",
    "/pricing",
  ];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
