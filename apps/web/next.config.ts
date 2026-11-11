import type { NextConfig } from "next";

const isExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export", images: { unoptimized: true } } : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
