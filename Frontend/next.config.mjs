/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: false,
  },
  transpilePackages: ["antd", "@rc-component/util"],
  images: {
    remotePatterns: [
      // Unsplash (hero images)
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      // Local Django dev server media files
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      // Tilda CDN (tour images uploaded via admin)
      { protocol: "https", hostname: "static.tildacdn.com" },
      { protocol: "https", hostname: "**.tildacdn.com" },
      // PythonAnywhere hosted backend (production media)
      { protocol: "https", hostname: "**.pythonanywhere.com" },
      // Allow any https host as fallback for admin-entered external image URLs
      { protocol: "https", hostname: "**" },
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
