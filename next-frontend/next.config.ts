import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  async rewrites() {
    const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    const defaultApi = "https://toursuit.pythonanywhere.com/api";
    const base = raw || defaultApi;
    const target = base.replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
};

export default nextConfig;
