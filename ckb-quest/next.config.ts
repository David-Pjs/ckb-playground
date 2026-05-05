import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@ckb-ccc/core"],
  outputFileTracingRoot: path.join(__dirname, "../"),
};

export default nextConfig;
