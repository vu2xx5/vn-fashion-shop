/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://localhost:8000"}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://localhost:8000"}/health`,
      },
      {
        source: "/docs",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://localhost:8000"}/docs`,
      },
      {
        source: "/openapi.json",
        destination: `${process.env.BACKEND_INTERNAL_URL || "http://localhost:8000"}/openapi.json`,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "api.vnfashion.vn",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

module.exports = nextConfig;
