import { NextResponse } from "next/server";
import { isCheckoutReady } from "@/server/env";
import { checkoutRequestSchema } from "@/server/domain/checkout-schema";
import { logger } from "@/server/logger";
import { clientIp, isSameOrigin, rateLimit, readBodyLimited, verifyTurnstile } from "@/server/security/request-guards";
import { startCheckout } from "@/server/services/checkout.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status, headers: NO_STORE });
}

export async function POST(req: Request) {
  if (!isCheckoutReady()) return fail(503, "El pago en línea no está disponible por ahora.");

  // Anti-CSRF: solo aceptamos POST desde nuestro propio dominio y en JSON.
  if (!isSameOrigin(req.headers)) return fail(403, "Origen no permitido.");
  if (!(req.headers.get("content-type") ?? "").startsWith("application/json")) return fail(415, "Formato no soportado.");

  const ip = clientIp(req.headers);
  if (!rateLimit(`checkout:m:${ip}`, 5, 60_000) || !rateLimit(`checkout:h:${ip}`, 20, 60 * 60_000)) {
    return fail(429, "Demasiados intentos. Espera un momento e intenta de nuevo.");
  }

  const raw = await readBodyLimited(req, 8 * 1024);
  if (raw === null) return fail(413, "Solicitud demasiado grande.");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "Solicitud inválida.");
  }

  const parsed = checkoutRequestSchema.safeParse(json);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))];
    return fail(422, "Revisa los datos del formulario.", { fields });
  }

  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
    return fail(400, "No pudimos verificar que eres humano. Recarga la página e intenta de nuevo.");
  }

  try {
    const result = await startCheckout(parsed.data, ip);
    if (!result.ok) {
      const status = result.code === "PAYMENT_PROVIDER" ? 502 : 409;
      return fail(status, result.message, { code: result.code });
    }
    return NextResponse.json({ ok: true, checkoutUrl: result.checkoutUrl }, { headers: NO_STORE });
  } catch (err) {
    logger.error("checkout.unexpected", { error: String(err) });
    return fail(500, "Ocurrió un error. Intenta de nuevo.");
  }
}
