import "server-only";
import { getPool, type DbClient, type Queryable } from "@/server/db/pool";
import type { StockRow } from "@/server/domain/stock";

/**
 * Acceso a datos (Postgres / Supabase). Regla única: SIEMPRE placeholders `$n`.
 * Los nombres de tablas/columnas son fijos en el código; ningún dato del
 * usuario se usa para construir SQL.
 */

const db = (): Queryable => getPool();
const clampLimit = (n: number) => Math.min(Math.max(1, Math.trunc(n)), 50);

// ─── Stock ───────────────────────────────────────────────────────────────────

export async function getAllStock(conn: Queryable = db()): Promise<StockRow[]> {
  const { rows } = await conn.query<StockRow>(
    "SELECT slug, qty, low_threshold, safety_buffer FROM stock ORDER BY slug",
  );
  return rows;
}

export async function getStock(slug: string, conn: Queryable = db()): Promise<StockRow | undefined> {
  const { rows } = await conn.query<StockRow>(
    "SELECT slug, qty, low_threshold, safety_buffer FROM stock WHERE slug = $1",
    [slug],
  );
  return rows[0];
}

/** Bloquea las filas de stock dentro de una transacción (evita doble venta simultánea). */
export async function lockStock(conn: DbClient, slugs: string[]): Promise<Map<string, StockRow>> {
  const map = new Map<string, StockRow>();
  for (const slug of [...slugs].sort()) {
    const { rows } = await conn.query<StockRow>(
      "SELECT slug, qty, low_threshold, safety_buffer FROM stock WHERE slug = $1 FOR UPDATE",
      [slug],
    );
    if (rows[0]) map.set(slug, rows[0]);
  }
  return map;
}

export async function setStockQty(
  conn: DbClient,
  slug: string,
  newQty: number,
  reason: string,
  actor: string,
): Promise<{ before: number; after: number }> {
  const { rows } = await conn.query<{ qty: number }>("SELECT qty FROM stock WHERE slug = $1 FOR UPDATE", [slug]);
  const before = rows[0] ? Number(rows[0].qty) : 0;
  const after = Math.max(0, newQty);
  await conn.query(
    `INSERT INTO stock (slug, qty) VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET qty = EXCLUDED.qty`,
    [slug, after],
  );
  await conn.query(
    "INSERT INTO stock_log (slug, delta, qty_after, reason, actor) VALUES ($1, $2, $3, $4, $5)",
    [slug, after - before, after, reason, actor.slice(0, 120)],
  );
  return { before, after };
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────

export interface NewOrder {
  publicId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingType: string;
  department: string;
  municipality: string;
  address: string;
  addressReference: string | null;
  notes: string | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  clientIp: string;
  expiresAt: Date;
  items: Array<{ slug: string; name: string; unitPriceCents: number; quantity: number }>;
}

export async function insertOrder(conn: DbClient, o: NewOrder): Promise<number> {
  const { rows } = await conn.query<{ id: number }>(
    `INSERT INTO web_orders
      (public_id, customer_name, customer_email, customer_phone, shipping_type, department,
       municipality, address, address_reference, notes, subtotal_cents, shipping_cents,
       total_cents, client_ip, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING id`,
    [
      o.publicId, o.customerName, o.customerEmail, o.customerPhone, o.shippingType, o.department,
      o.municipality, o.address, o.addressReference, o.notes, o.subtotalCents, o.shippingCents,
      o.totalCents, o.clientIp, o.expiresAt,
    ],
  );
  const orderId = rows[0].id;
  for (const it of o.items) {
    await conn.query(
      "INSERT INTO web_order_items (order_id, slug, name, unit_price_cents, quantity) VALUES ($1, $2, $3, $4, $5)",
      [orderId, it.slug, it.name, it.unitPriceCents, it.quantity],
    );
  }
  return orderId;
}

export async function setOrderCheckoutId(orderId: number, checkoutId: string): Promise<void> {
  await db().query("UPDATE web_orders SET recurrente_checkout_id = $1 WHERE id = $2", [checkoutId, orderId]);
}

export async function deleteUnpaidOrder(orderId: number): Promise<void> {
  await db().query("DELETE FROM web_orders WHERE id = $1 AND status = 'PENDING_PAYMENT'", [orderId]);
}

export interface OrderRow {
  id: number;
  public_id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_type: string;
  department: string;
  municipality: string;
  address: string;
  address_reference: string | null;
  notes: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  recurrente_checkout_id: string | null;
  paid_cents: number | null;
  oversold: number;
  registered_in_saas: number;
  created_at: Date;
  paid_at: Date | null;
}

export interface OrderItemRow {
  slug: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
}

export async function lockOrderByCheckoutId(conn: DbClient, checkoutId: string): Promise<OrderRow | undefined> {
  const { rows } = await conn.query<OrderRow>(
    "SELECT * FROM web_orders WHERE recurrente_checkout_id = $1 FOR UPDATE",
    [checkoutId],
  );
  return rows[0];
}

export async function getOrderItems(orderId: number, conn: Queryable = db()): Promise<OrderItemRow[]> {
  const { rows } = await conn.query<OrderItemRow>(
    "SELECT slug, name, unit_price_cents, quantity FROM web_order_items WHERE order_id = $1 ORDER BY id",
    [orderId],
  );
  return rows;
}

export async function markOrderPaid(
  conn: DbClient,
  orderId: number,
  status: "PAID" | "REVIEW",
  paymentId: string | null,
  paidCents: number | null,
  oversold: boolean,
): Promise<void> {
  await conn.query(
    `UPDATE web_orders SET status = $1, recurrente_payment_id = $2, paid_cents = $3, oversold = $4, paid_at = now()
     WHERE id = $5`,
    [status, paymentId, paidCents, oversold ? 1 : 0, orderId],
  );
}

export async function setOrderStatus(orderId: number, status: string, conn: Queryable = db()): Promise<void> {
  await conn.query("UPDATE web_orders SET status = $1 WHERE id = $2", [status, orderId]);
}

export async function getOrderByPublicId(publicId: string): Promise<Pick<OrderRow, "id" | "status" | "total_cents" | "customer_name"> | undefined> {
  const { rows } = await db().query<Pick<OrderRow, "id" | "status" | "total_cents" | "customer_name">>(
    "SELECT id, status, total_cents, customer_name FROM web_orders WHERE public_id = $1",
    [publicId],
  );
  return rows[0];
}

export async function listUnregisteredPaidOrders(limit = 20): Promise<OrderRow[]> {
  const { rows } = await db().query<OrderRow>(
    `SELECT * FROM web_orders WHERE status IN ('PAID','REVIEW') AND registered_in_saas = 0
     ORDER BY paid_at ASC LIMIT $1`,
    [clampLimit(limit)],
  );
  return rows;
}

export async function markRegistered(orderId: number, actor: string): Promise<boolean> {
  const res = await db().query(
    `UPDATE web_orders SET registered_in_saas = 1, registered_by = $1
     WHERE id = $2 AND status IN ('PAID','REVIEW') AND registered_in_saas = 0`,
    [actor.slice(0, 120), orderId],
  );
  return res.rowCount === 1;
}

export async function expireStaleOrders(): Promise<number> {
  const res = await db().query(
    "UPDATE web_orders SET status = 'EXPIRED' WHERE status = 'PENDING_PAYMENT' AND expires_at < now()",
  );
  return res.rowCount ?? 0;
}

// ─── Webhooks (idempotencia) ─────────────────────────────────────────────────

/** Inserta el evento; lanza unique_violation (23505) si ya fue procesado. */
export async function insertWebhookEvent(conn: DbClient, eventId: string, provider: string, type: string) {
  await conn.query("INSERT INTO webhook_events (event_id, provider, event_type) VALUES ($1, $2, $3)", [
    eventId.slice(0, 100),
    provider,
    type.slice(0, 60),
  ]);
}

// ─── Notificaciones (outbox) ─────────────────────────────────────────────────

export interface NewNotification {
  channel: "telegram" | "email";
  recipient: string;
  subject?: string | null;
  bodyText: string;
  bodyHtml?: string | null;
  orderId?: number | null;
}

export async function enqueueNotifications(conn: Queryable, list: NewNotification[]): Promise<void> {
  for (const n of list) {
    await conn.query(
      `INSERT INTO notifications (channel, recipient, subject, body_text, body_html, order_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [n.channel, n.recipient, n.subject ?? null, n.bodyText, n.bodyHtml ?? null, n.orderId ?? null],
    );
  }
}

export interface NotificationRow {
  id: number;
  channel: "telegram" | "email";
  recipient: string;
  subject: string | null;
  body_text: string;
  body_html: string | null;
  attempts: number;
}

export async function claimDueNotifications(limit = 20): Promise<NotificationRow[]> {
  const pool = getPool();
  // Libera envíos que quedaron "colgados" (proceso reiniciado a mitad de envío).
  await pool.query(
    "UPDATE notifications SET status = 'pending' WHERE status = 'sending' AND updated_at < now() - interval '10 minutes'",
  );
  // Reclama en una sola sentencia atómica; SKIP LOCKED evita que dos crons tomen el mismo aviso.
  const { rows } = await pool.query<NotificationRow>(
    `UPDATE notifications SET status = 'sending'
     WHERE id IN (
       SELECT id FROM notifications
       WHERE status = 'pending' AND next_attempt_at <= now()
       ORDER BY id LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, channel, recipient, subject, body_text, body_html, attempts`,
    [clampLimit(limit)],
  );
  return rows.sort((a, b) => a.id - b.id);
}

export async function markNotificationSent(id: number): Promise<void> {
  await getPool().query("UPDATE notifications SET status = 'sent', attempts = attempts + 1, last_error = NULL WHERE id = $1", [id]);
}

export async function markNotificationFailed(id: number, attempts: number, error: string): Promise<void> {
  const BACKOFF_MIN = [1, 5, 15, 60, 240];
  const final = attempts + 1 >= BACKOFF_MIN.length + 1;
  const delay = BACKOFF_MIN[Math.min(attempts, BACKOFF_MIN.length - 1)];
  await getPool().query(
    `UPDATE notifications
     SET status = $1, attempts = attempts + 1, last_error = $2,
         next_attempt_at = now() + make_interval(mins => $3::int)
     WHERE id = $4`,
    [final ? "failed" : "pending", error.slice(0, 500), delay, id],
  );
}
