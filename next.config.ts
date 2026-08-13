import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "private, no-store, no-cache, max-age=0, must-revalidate" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
