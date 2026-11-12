import { NextResponse } from "next/server";
import { getEnv } from "@/server/env";
import { logger } from "@/server/logger";
import { readBodyLimited } from "@/server/security/request-guards";
import { safeEqual } from "@/server/security/sanitize";
import { handleTelegramUpdate } from "@/server/telegram/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook del bot de Telegram. Telegram envía la cabecera
 * X-Telegram-Bot-Api-Secret-Token con el valor que registramos en setWebhook.
 */
export async function POST(req: Request) {
  const secret = getEnv().TELEGRAM_WEBHOOK_SECRET;
  const given = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!secret || !safeEqual(given, secret)) return new NextResponse(null, { status: 401 });

  const raw = await readBodyLimited(req, 64 * 1024);
  if (raw === null) return new NextResponse(null, { status: 413 });

  try {
    await handleTelegramUpdate(JSON.parse(raw));
  } catch (err) {
    logger.error("telegram.webhook_error", { error: String(err) });
  }
  // Siempre 200: si respondemos error, Telegram reintenta el mismo comando.
  return NextResponse.json({ ok: true });
}
