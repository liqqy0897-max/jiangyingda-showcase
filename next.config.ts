import type { NextConfig } from "next";

const staticShowcase = process.env.STATIC_SHOWCASE === "true";

const nextConfig: NextConfig = {
  ...(staticShowcase
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : { output: "standalone" as const }),
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: false,
  },
};

export default nextConfig;
