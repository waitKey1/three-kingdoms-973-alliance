import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "exceljs"],
  experimental: { cpus: 2 },
};

export default nextConfig;
