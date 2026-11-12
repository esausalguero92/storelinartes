import "server-only";
import { allowedOrigins, getEnv } from "@/server/env";

// ─── IP del cliente ──────────────────────────────────────────────────────────
/**
 * Hostinger pone un proxy delante de Node que AGREGA la IP real al final de
 * X-Forwarded-For. Lo que el cliente mande al inicio de esa cabecera es
 * falsificable, así que contamos desde la derecha según los saltos confiables.
 */
export function clientIp(headers: Headers): string {
  const hops = Math.max(1, getEnv().TRUSTED_PROXY_HOPS);
  const xff = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ip = xff.length >= hops ? xff[xff.length - hops] : headers.get("x-real-ip") ?? "unknown";
  return /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip : "unknown";
}

// ─── Anti-CSRF: el POST debe venir de nuestro propio sitio ──────────────────
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  try {
    return allowedOrigins().includes(new URL(origin).origin);
  } catch {
    return false;
  }
}

// ─── Rate limit en memoria (la app corre en 1 proceso en Hostinger) ─────────
type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/**
 * Ventana deslizante. Devuelve true si la petición está permitida.
 * Ej.: rateLimit(`checkout:${ip}`, 5, 60_000) → 5 por minuto por IP.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastSweep > 5 * 60_000) {
    for (const [k, b] of buckets) if (b.hits.every((t) => now - t > 60 * 60_000)) buckets.delete(k);
    lastSweep = now;
  }
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}

// ─── Cloudflare Turnstile (verificación anti-bots en el servidor) ───────────
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const env = getEnv();
  if (env.TURNSTILE_DISABLED) return env.NODE_ENV !== "production";
  if (!token || !env.TURNSTILE_SECRET_KEY) return false;
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch(env.TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean; hostname?: string };
    if (!data.success) return false;
    // El token debe haberse emitido para nuestro dominio.
    const expected = new URL(env.SITE_URL).hostname.replace(/^www\./, "");
    return !data.hostname || data.hostname.replace(/^www\./, "") === expected;
  } catch {
    return false;
  }
}

/** Lee el cuerpo con límite de tamaño (evita cuerpos gigantes). */
export async function readBodyLimited(req: Request, maxBytes: number): Promise<string | null> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > maxBytes) return null;
  const text = await req.text();
  return Buffer.byteLength(text, "utf8") > maxBytes ? null : text;
}
