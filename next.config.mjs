/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Docker (Easypanel) ─────────────────────────────────────────────────────
  // El Dockerfile activa NEXT_STANDALONE=1 para generar un servidor mínimo.
  // En Hostinger (npm start) no se define y todo funciona como antes.
  ...(process.env.NEXT_STANDALONE === "1" ? { output: "standalone" } : {}),

  // ─── Performance ────────────────────────────────────────────────────────────
  compress: true,
  poweredByHeader: false,

  // ─── Images ─────────────────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // ─── Security Headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",          value: "DENY" },
          // CSP con nonce se define en src/middleware.ts
          { key: "X-XSS-Protection",         value: "0" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        // Las respuestas de la API nunca se cachean (datos de pedidos / pagos).
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },

  // ─── Redirects ───────────────────────────────────────────────────────────────
  async redirects() {
    return [];
  },
};

export default nextConfig;
