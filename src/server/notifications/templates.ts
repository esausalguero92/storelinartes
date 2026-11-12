import type { OrderItemRow, OrderRow } from "@/server/db/repositories";
import { escapeHtml } from "@/server/security/sanitize";

/**
 * Plantillas de mensajes. TODO dato del cliente pasa por escapeHtml() antes
 * de entrar a HTML (correo o Telegram con parse_mode=HTML).
 */

export function orderNumber(id: number): string {
  return `LW-${String(id).padStart(5, "0")}`;
}

function q(cents: number): string {
  return `Q${(cents / 100).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Order = Pick<
  OrderRow,
  | "id" | "customer_name" | "customer_email" | "customer_phone" | "shipping_type" | "department"
  | "municipality" | "address" | "address_reference" | "notes" | "subtotal_cents" | "shipping_cents" | "total_cents"
>;

interface Flags {
  review?: string | null; // motivo de revisión (monto distinto, etc.)
  oversold?: string[]; // productos sin stock suficiente
}

// ─── Telegram (equipo) ───────────────────────────────────────────────────────
export function teamTelegram(order: Order, items: OrderItemRow[], flags: Flags = {}): string {
  const e = escapeHtml;
  const lines = [
    `🛍️ <b>Nueva venta web ${orderNumber(order.id)}</b>`,
    flags.review ? `⚠️ <b>REVISAR:</b> ${e(flags.review)}` : null,
    flags.oversold?.length ? `⚠️ <b>Sin stock web suficiente:</b> ${e(flags.oversold.join(", "))}` : null,
    "",
    ...items.map((i) => `• ${i.quantity} × ${e(i.name)} — ${q(i.unit_price_cents * i.quantity)}`),
    order.shipping_cents > 0 ? `• Envío — ${q(order.shipping_cents)}` : null,
    `<b>Total pagado: ${q(order.total_cents)}</b>`,
    "",
    `👤 ${e(order.customer_name)}`,
    `📞 ${e(order.customer_phone)}`,
    `✉️ ${e(order.customer_email)}`,
    `📍 ${e(order.shipping_type)} · ${e(order.municipality)}, ${e(order.department)}`,
    `${e(order.address)}${order.address_reference ? ` (${e(order.address_reference)})` : ""}`,
    order.notes ? `📝 ${e(order.notes)}` : null,
    "",
    `📋 Recuerda registrar ${orderNumber(order.id)} en el SAAS (canal WEB).`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

// ─── Correo (equipo) ─────────────────────────────────────────────────────────
export function teamEmail(order: Order, items: OrderItemRow[], flags: Flags = {}) {
  const subject = `${flags.review || flags.oversold?.length ? "[REVISAR] " : ""}Nueva venta web ${orderNumber(order.id)} — ${q(order.total_cents)}`;
  const text = teamTelegram(order, items, flags).replace(/<[^>]+>/g, "");
  const html = wrap(`
    <h2 style="margin:0 0 12px">Nueva venta web ${orderNumber(order.id)}</h2>
    ${flags.review ? `<p style="color:#b45309"><b>REVISAR:</b> ${escapeHtml(flags.review)}</p>` : ""}
    ${flags.oversold?.length ? `<p style="color:#b45309"><b>Sin stock web suficiente:</b> ${escapeHtml(flags.oversold.join(", "))}</p>` : ""}
    ${itemsTable(order, items)}
    <h3 style="margin:20px 0 6px">Cliente</h3>
    <p style="margin:0">${escapeHtml(order.customer_name)}<br>${escapeHtml(order.customer_phone)}<br>${escapeHtml(order.customer_email)}</p>
    <h3 style="margin:20px 0 6px">Envío (${escapeHtml(order.shipping_type)})</h3>
    <p style="margin:0">${escapeHtml(order.address)}<br>${escapeHtml(order.municipality)}, ${escapeHtml(order.department)}
    ${order.address_reference ? `<br>Ref: ${escapeHtml(order.address_reference)}` : ""}</p>
    ${order.notes ? `<p><b>Notas:</b> ${escapeHtml(order.notes)}</p>` : ""}
    <p style="color:#666;font-size:12px;margin-top:24px">Recuerda registrar este pedido en el SAAS (canal WEB).</p>
  `);
  return { subject, text, html };
}

// ─── Correo (cliente) ────────────────────────────────────────────────────────
export function customerEmail(order: Order, items: OrderItemRow[]) {
  const first = order.customer_name.split(" ")[0] ?? "";
  const subject = `Confirmamos tu pedido ${orderNumber(order.id)} — Linartes`;
  const text = [
    `Hola ${first}, gracias por tu compra en Linartes.`,
    `Tu pago fue confirmado. Pedido: ${orderNumber(order.id)}`,
    ...items.map((i) => `- ${i.quantity} x ${i.name}: ${q(i.unit_price_cents * i.quantity)}`),
    order.shipping_cents > 0 ? `- Envío: ${q(order.shipping_cents)}` : "",
    `Total: ${q(order.total_cents)}`,
    `Envío a: ${order.address}, ${order.municipality}, ${order.department}`,
    "Te contactaremos para coordinar la entrega.",
  ].filter(Boolean).join("\n");
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-family:Georgia,serif">¡Gracias por tu compra, ${escapeHtml(first)}!</h2>
    <p style="margin:0 0 16px">Tu pago fue confirmado. Número de pedido: <b>${orderNumber(order.id)}</b></p>
    ${itemsTable(order, items)}
    <h3 style="margin:20px 0 6px">Dirección de entrega</h3>
    <p style="margin:0">${escapeHtml(order.address)}<br>${escapeHtml(order.municipality)}, ${escapeHtml(order.department)}</p>
    <p style="margin-top:20px">Te contactaremos para coordinar la entrega. Si tienes dudas, responde a este correo.</p>
  `);
  return { subject, text, html };
}

function itemsTable(order: Order, items: OrderItemRow[]): string {
  const rows = items
    .map(
      (i) => `<tr><td style="padding:6px 0">${i.quantity} × ${escapeHtml(i.name)}</td>
        <td style="padding:6px 0;text-align:right">${q(i.unit_price_cents * i.quantity)}</td></tr>`,
    )
    .join("");
  const ship = order.shipping_cents > 0
    ? `<tr><td style="padding:6px 0">Envío</td><td style="padding:6px 0;text-align:right">${q(order.shipping_cents)}</td></tr>`
    : "";
  return `<table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd">
    ${rows}${ship}
    <tr><td style="padding:8px 0;font-weight:bold">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold">${q(order.total_cents)}</td></tr>
  </table>`;
}

function wrap(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F4F0EA;font-family:Arial,Helvetica,sans-serif;color:#0B0B0D">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#404537;color:#F2F4E5;padding:16px 20px;border-radius:12px 12px 0 0;letter-spacing:4px;font-family:Georgia,serif;font-size:20px">LINARTES</div>
    <div style="background:#ffffff;padding:24px 20px;border-radius:0 0 12px 12px">${inner}</div>
    <p style="font-size:11px;color:#8A847C;text-align:center;margin-top:12px">Linartes Design · Guatemala</p>
  </div></body></html>`;
}
