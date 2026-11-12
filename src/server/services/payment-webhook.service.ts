import "server-only";
import { getEnv } from "@/server/env";
import { isDuplicateKey, withTransaction, type DbClient } from "@/server/db/pool";
import {
  enqueueNotifications,
  getOrderItems,
  insertWebhookEvent,
  lockOrderByCheckoutId,
  markOrderPaid,
  setStockQty,
  lockStock,
  type NewNotification,
} from "@/server/db/repositories";
import { logger } from "@/server/logger";
import { customerEmail, orderNumber, teamEmail, teamTelegram } from "@/server/notifications/templates";
import { getCheckout, type RecurrenteEvent } from "@/server/payments/recurrente";
import { escapeHtml } from "@/server/security/sanitize";

export type WebhookOutcome = "processed" | "duplicate" | "ignored";

/**
 * Procesa un evento de Recurrente YA verificado (firma Svix válida).
 *  - Idempotente: el svix-id se guarda en webhook_events dentro de la misma
 *    transacción; si llega repetido, no se vuelve a descontar stock ni a notificar.
 *  - Si algo falla se hace rollback y se responde 500 → Recurrente reintenta.
 */
export async function handleRecurrenteEvent(eventId: string, event: RecurrenteEvent): Promise<WebhookOutcome> {
  const type = event.event_type ?? event.type ?? "unknown";

  if (type === "intent.succeeded" && event.checkout?.id) {
    return handlePaymentSucceeded(eventId, type, event);
  }
  if (type === "refund.create") {
    return recordAndNotify(eventId, type, `↩️ <b>Reembolso</b> registrado en Recurrente (${escapeHtml(event.id ?? "sin id")}). Revisa el pedido y el stock.`);
  }
  if (type === "dispute.create") {
    return recordAndNotify(eventId, type, `⚠️ <b>Contracargo/disputa</b> abierta en Recurrente (${escapeHtml(event.id ?? "sin id")}).`);
  }
  // intent.failed, intent.canceled, intent.pending, etc.: solo se registran.
  return recordOnly(eventId, type);
}

async function handlePaymentSucceeded(eventId: string, type: string, event: RecurrenteEvent): Promise<WebhookOutcome> {
  const checkoutId = event.checkout!.id!;
  // Defensa en profundidad: confirmamos contra la API de Recurrente (no solo el webhook).
  const remote = await getCheckout(checkoutId);

  return withTransaction(async (conn) => {
    if (!(await tryInsertEvent(conn, eventId, type))) return "duplicate";

    const order = await lockOrderByCheckoutId(conn, checkoutId);
    if (!order) {
      logger.warn("webhook.order_not_found", { checkoutId });
      return "ignored";
    }
    if (order.status === "PAID" || order.status === "REVIEW" || order.status === "REFUNDED") return "duplicate";

    // Validaciones de monto y moneda.
    const paidCents = typeof event.amount_in_cents === "number" ? event.amount_in_cents : remote.total_in_cents ?? null;
    let review: string | null = null;
    if (remote.status !== "paid") review = `Recurrente reporta el checkout como "${remote.status}"`;
    else if (paidCents !== order.total_cents) review = `Monto pagado (${paidCents}) distinto al total (${order.total_cents})`;
    else if ((event.currency ?? remote.currency ?? "GTQ") !== "GTQ") review = "Moneda distinta de GTQ";

    // Descuenta stock (el cliente ya pagó: si no alcanza, se marca como sobreventa).
    const items = await getOrderItems(order.id, conn);
    const stock = await lockStock(conn, items.map((i) => i.slug));
    const oversold: string[] = [];
    for (const it of items) {
      const current = stock.get(it.slug)?.qty ?? 0;
      if (current < it.quantity) oversold.push(it.name);
      await setStockQty(conn, it.slug, current - it.quantity, "sale", orderNumber(order.id));
    }

    const status = review ? "REVIEW" : "PAID";
    await markOrderPaid(conn, order.id, status, event.id ?? null, paidCents, oversold.length > 0);

    // Encola notificaciones (se envían fuera de la transacción).
    const env = getEnv();
    const flags = { review, oversold };
    const list: NewNotification[] = [];
    if (env.TELEGRAM_TEAM_CHAT_ID) {
      list.push({ channel: "telegram", recipient: env.TELEGRAM_TEAM_CHAT_ID, bodyText: teamTelegram(order, items, flags), orderId: order.id });
    }
    const team = teamEmail(order, items, flags);
    for (const to of env.MAIL_TEAM_TO) {
      list.push({ channel: "email", recipient: to, subject: team.subject, bodyText: team.text, bodyHtml: team.html, orderId: order.id });
    }
    if (status === "PAID") {
      const c = customerEmail(order, items);
      list.push({ channel: "email", recipient: order.customer_email, subject: c.subject, bodyText: c.text, bodyHtml: c.html, orderId: order.id });
    }
    await enqueueNotifications(conn, list);

    logger.info("webhook.payment_succeeded", { orderId: order.id, status, oversold: oversold.length });
    return "processed";
  });
}

async function recordOnly(eventId: string, type: string): Promise<WebhookOutcome> {
  return withTransaction(async (conn) => ((await tryInsertEvent(conn, eventId, type)) ? "ignored" : "duplicate"));
}

async function recordAndNotify(eventId: string, type: string, html: string): Promise<WebhookOutcome> {
  const env = getEnv();
  return withTransaction(async (conn) => {
    if (!(await tryInsertEvent(conn, eventId, type))) return "duplicate";
    if (env.TELEGRAM_TEAM_CHAT_ID) {
      await enqueueNotifications(conn, [{ channel: "telegram", recipient: env.TELEGRAM_TEAM_CHAT_ID, bodyText: html }]);
    }
    return "processed";
  });
}

async function tryInsertEvent(conn: DbClient, eventId: string, type: string): Promise<boolean> {
  try {
    await insertWebhookEvent(conn, eventId, "recurrente", type);
    return true;
  } catch (err) {
    if (isDuplicateKey(err)) return false;
    throw err;
  }
}

