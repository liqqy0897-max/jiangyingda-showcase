import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: false,
  },
};

export default nextConfig;
