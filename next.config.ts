import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      {
        protocol: "https",
        hostname: "*.cloudflareimages.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com",
      },
    ],
  },
};

export default nextConfig;
