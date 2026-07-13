import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const tunnelRatCompat = fileURLToPath(new URL("./app/lib/react19-tunnel.tsx", import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "tunnel-rat": tunnelRatCompat,
    };
    return config;
  },
};

export default nextConfig;
