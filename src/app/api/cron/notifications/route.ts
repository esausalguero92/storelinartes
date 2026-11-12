import { NextResponse } from "next/server";
import { getEnv } from "@/server/env";
import { expireStaleOrders } from "@/server/db/repositories";
import { logger } from "@/server/logger";
import { dispatchPending } from "@/server/notifications/dispatcher";
import { safeEqual } from "@/server/security/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tarea programada (cron de hPanel cada 5 min):
 *   curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://linartes.com/api/cron/notifications
 * Reintenta notificaciones pendientes y expira pedidos no pagados.
 */
export async function POST(req: Request) {
  const secret = getEnv().CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new NextResponse(null, { status: 401 });

  try {
    const expired = await expireStaleOrders();
    const result = await dispatchPending();
    logger.info("cron.run", { expired, ...result });
    return NextResponse.json({ expired, ...result });
  } catch (err) {
    logger.error("cron.error", { error: String(err) });
    return new NextResponse(null, { status: 500 });
  }
}
