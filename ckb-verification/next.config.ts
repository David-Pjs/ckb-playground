import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@ckb-ccc/core"],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
