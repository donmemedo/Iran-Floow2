import type { NextConfig } from "next";

const api = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  redirects: async () => [{ source: "/", destination: "/fa", permanent: false }],
  // Browser calls same-origin /api; baked at build time, so Docker passes API_URL as a build arg.
  rewrites: async () => ({ beforeFiles: [{ source: "/api/:path*", destination: `${api}/api/:path*` }], afterFiles: [], fallback: [] }),
};

export default nextConfig;
