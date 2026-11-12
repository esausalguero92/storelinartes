import "server-only";
import {
  claimDueNotifications,
  markNotificationFailed,
  markNotificationSent,
} from "@/server/db/repositories";
import { logger } from "@/server/logger";
import { sendEmail, sendTelegram } from "@/server/notifications/channels";

let running = false;

/**
 * Envía las notificaciones pendientes (outbox) con reintentos exponenciales.
 * Se llama justo después de un pago y también desde el cron de hPanel,
 * así que si el SMTP o Telegram fallan, se reintenta solo.
 */
export async function dispatchPending(): Promise<{ sent: number; failed: number }> {
  if (running) return { sent: 0, failed: 0 };
  running = true;
  let sent = 0;
  let failed = 0;
  try {
    const batch = await claimDueNotifications(20);
    for (const n of batch) {
      try {
        if (n.channel === "telegram") await sendTelegram(n.recipient, n.body_text);
        else await sendEmail(n.recipient, n.subject ?? "Linartes", n.body_text, n.body_html);
        await markNotificationSent(n.id);
        sent++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn("notification.failed", { id: n.id, channel: n.channel, attempts: n.attempts + 1, error: msg });
        await markNotificationFailed(n.id, n.attempts, msg);
      }
    }
  } finally {
    running = false;
  }
  return { sent, failed };
}
