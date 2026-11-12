import { NextResponse, type NextRequest } from "next/server";

/**
 * Content-Security-Policy con nonce por petición.
 * - Solo se ejecutan scripts propios que Next marca con el nonce ('strict-dynamic'
 *   permite los que ellos cargan, como el widget anti-bots de Cloudflare).
 * - Sin 'unsafe-inline' ni 'unsafe-eval' en producción → mitiga XSS.
 */
export function middleware(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV !== "production";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.unsplash.com",
    `connect-src 'self' https://challenges.cloudflare.com${isDev ? " ws:" : ""}`,
    "frame-src https://challenges.cloudflare.com",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml|logo.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
