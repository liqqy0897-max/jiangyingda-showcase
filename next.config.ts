import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: false,
  },
};

export default nextConfig;
