import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/lectures",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src https://drive.google.com https://www.youtube.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
