import type { NextConfig } from "next";

/**
 * Content-Security-Policy
 * Razorpay checkout ke liye zaroori domains allow kiye gaye hain.
 * Agar aap koi naya third-party script add karein to usko yahan add karna hoga.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://securegw.paytm.in https://securegw-stage.paytm.in",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://securegw.paytm.in https://securegw-stage.paytm.in",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Photos Cloudinary se aati hain; admin manually koi doosra https link bhi
  // paste kar sakta hai, isliye https images allow hain (sirf images).
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.razorpay.com https://lumberjack.razorpay.com https://api.cloudinary.com https://securegw.paytm.in https://securegw-stage.paytm.in",
  "frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://securegw.paytm.in https://securegw-stage.paytm.in",
  "form-action 'self' https://securegw.paytm.in https://securegw-stage.paytm.in",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Koi remote image allow nahi — saari artwork SVG se code me banti hai.
    // (Isse Next ka image optimizer open-proxy ki tarah misuse nahi ho sakta.)
    remotePatterns: [],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Admin panel kabhi cache / index nahi hona chahiye
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
