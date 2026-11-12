import { after, NextResponse } from "next/server";
import { logger } from "@/server/logger";
import { dispatchPending } from "@/server/notifications/dispatcher";
import { verifyWebhook } from "@/server/payments/recurrente";
import { readBodyLimited } from "@/server/security/request-guards";
import { handleRecurrenteEvent } from "@/server/services/payment-webhook.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de Recurrente.
 *  1) Firma Svix verificada sobre el cuerpo crudo (401 si no es válida).
 *  2) Procesamiento idempotente en transacción.
 *  3) 2xx rápido; las notificaciones se envían después de responder.
 *  4) Si falla el procesamiento → 500 y Recurrente reintenta (1m, 5m, 30m, 2h, 6h).
 */
export async function POST(req: Request) {
  const raw = await readBodyLimited(req, 256 * 1024);
  if (raw === null) return new NextResponse(null, { status: 413 });

  let event;
  try {
    event = verifyWebhook(raw, req.headers);
  } catch (err) {
    logger.warn("webhook.invalid_signature", { error: err instanceof Error ? err.message : "?" });
    return new NextResponse(null, { status: 401 });
  }

  const eventId = req.headers.get("svix-id") ?? "";
  try {
    const outcome = await handleRecurrenteEvent(eventId, event);
    logger.info("webhook.received", { eventId, type: event.event_type ?? event.type, outcome });
    if (outcome === "processed") {
      after(() => dispatchPending().catch((e) => logger.error("dispatch.error", { error: String(e) })));
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("webhook.processing_error", { eventId, error: String(err) });
    return new NextResponse(null, { status: 500 });
  }
}
