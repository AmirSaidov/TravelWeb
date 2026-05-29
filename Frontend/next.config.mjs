/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: false,
  },
  transpilePackages: ["antd", "@rc-component/util"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
    ],
  },
  async rewrites() {
    const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    const base = raw || "/api";
    const target = base.replace(/\/+$/, "");

    // If NEXT_PUBLIC_API_URL is not set, keep `/api/*` as-is so
    // the app can be deployed behind a reverse-proxy or same-origin API.
    if (!raw) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
};

export default nextConfig;
