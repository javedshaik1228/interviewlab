import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const tunnelRatCompat = fileURLToPath(new URL("./app/lib/react19-tunnel.tsx", import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  // Type-check explicitly in the build script so Next does not start a second,
  // memory-heavy validation worker after webpack has finished.
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "tunnel-rat": tunnelRatCompat,
    };
    return config;
  },
};

export default nextConfig;
