import type { NextConfig } from "next";

/** Where the .NET API is reachable from the Next.js server (not from the browser). */
const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:5011";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // The browser only ever talks to this origin. /api and /uploads are proxied to the .NET API,
  // so the auth and cart cookies are first-party and no CORS is needed.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
      { source: "/uploads/:path*", destination: `${apiUrl}/uploads/:path*` },
    ];
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  images: {
    // Product photos are served by the API through the /uploads rewrite.
    localPatterns: [
      { pathname: "/uploads/**", search: "" },
      { pathname: "/images/**", search: "" },
      { pathname: "/logo.svg", search: "" },
    ],
  },
};

export default nextConfig;
