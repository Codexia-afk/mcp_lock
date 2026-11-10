import type { NextConfig } from "next";

const isExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export", images: { unoptimized: true } } : {}),
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
