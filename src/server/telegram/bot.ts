import "server-only";
import { products } from "@/data/products";
import { getEnv } from "@/server/env";
import { withTransaction } from "@/server/db/pool";
import { getAllStock, listUnregisteredPaidOrders, markRegistered, setStockQty } from "@/server/db/repositories";
import { resolveSlug, sellableUnits, STOCK_LABEL, stockStatus } from "@/server/domain/stock";
import { logger } from "@/server/logger";
import { sendTelegram } from "@/server/notifications/channels";
import { orderNumber } from "@/server/notifications/templates";
import { escapeHtml } from "@/server/security/sanitize";

/**
 * Bot de Telegram para operar el stock web.
 * Seguridad:
 *  - El webhook exige la cabecera secreta de Telegram (se valida en la ruta).
 *  - Solo responde en los chats de TELEGRAM_ALLOWED_CHAT_IDS.
 *  - Si TELEGRAM_ADMIN_USER_IDS tiene valores, solo esos usuarios pueden modificar.
 *  - Los argumentos se validan con regex estrictas; nunca llegan crudos al SQL.
 */

interface TgUpdate {
  message?: {
    text?: string;
    chat?: { id?: number };
    from?: { id?: number; username?: string; first_name?: string };
  };
}

const KNOWN_SLUGS = products.map((p) => p.slug);
const MAX_QTY = 100_000;

const HELP = [
  "<b>Comandos Linartes</b>",
  "/stock — ver inventario web",
  "/stock &lt;producto&gt; &lt;cantidad&gt; — fijar cantidad (ej. <code>/stock marco 12</code>)",
  "/sumar &lt;producto&gt; &lt;cantidad&gt; — sumar llegada de mercadería",
  "/restar &lt;producto&gt; &lt;cantidad&gt; — descontar venta de otro canal",
  "/pedidos — ventas web pagadas sin registrar en el SAAS",
  "/registrado &lt;LW-00001&gt; — marcar como registrado en el SAAS",
  "",
  `Productos: ${KNOWN_SLUGS.map((s) => `<code>${s}</code>`).join(", ")}`,
].join("\n");

export async function handleTelegramUpdate(update: TgUpdate): Promise<void> {
  const env = getEnv();
  const msg = update.message;
  const chatId = msg?.chat?.id;
  const text = msg?.text?.trim();
  if (!msg || chatId === undefined || !text || !text.startsWith("/")) return;

  // Chat no autorizado → se ignora en silencio (no revelamos que el bot existe).
  if (!env.TELEGRAM_ALLOWED_CHAT_IDS.includes(String(chatId))) {
    logger.warn("telegram.unauthorized_chat", { chatId });
    return;
  }

  const userId = String(msg.from?.id ?? "");
  const actor = `tg:${msg.from?.username ?? msg.from?.first_name ?? "?"}(${userId})`;
  const canWrite = env.TELEGRAM_ADMIN_USER_IDS.length === 0 || env.TELEGRAM_ADMIN_USER_IDS.includes(userId);

  const [rawCmd, ...args] = text.slice(0, 200).split(/\s+/);
  const cmd = rawCmd.toLowerCase().replace(/@.*$/, ""); // /stock@LinartesBot → /stock
  const reply = (html: string) => sendTelegram(String(chatId), html);

  try {
    switch (cmd) {
      case "/start":
      case "/ayuda":
      case "/help":
        return reply(HELP);

      case "/stock":
        if (args.length === 0) return reply(await stockReport());
        if (!canWrite) return reply("⛔ No tienes permiso para modificar el stock.");
        return reply(await changeStock(args, "set", actor));

      case "/sumar":
        if (!canWrite) return reply("⛔ No tienes permiso para modificar el stock.");
        return reply(await changeStock(args, "add", actor));

      case "/restar":
        if (!canWrite) return reply("⛔ No tienes permiso para modificar el stock.");
        return reply(await changeStock(args, "sub", actor));

      case "/pedidos":
        return reply(await pendingOrders());

      case "/registrado":
        if (!canWrite) return reply("⛔ No tienes permiso.");
        return reply(await registerOrder(args[0], actor));

      default:
        return reply("Comando no reconocido. Escribe /ayuda");
    }
  } catch (err) {
    logger.error("telegram.command_error", { cmd, error: String(err) });
    await reply("⚠️ Ocurrió un error procesando el comando.").catch(() => undefined);
  }
}

async function stockReport(): Promise<string> {
  const rows = await getAllStock();
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const lines = products.map((p) => {
    const r = bySlug.get(p.slug);
    const status = p.inStock ? STOCK_LABEL[stockStatus(r)] : "Oculto (inStock=false)";
    const detail = r ? `${r.qty} u. (vende ${sellableUnits(r)}, colchón ${r.safety_buffer})` : "sin registro";
    return `• <code>${p.slug}</code>\n   ${detail} → <b>${escapeHtml(status)}</b>`;
  });
  return ["<b>Stock web</b>", ...lines].join("\n");
}

async function changeStock(args: string[], mode: "set" | "add" | "sub", actor: string): Promise<string> {
  const [productArg, qtyArg] = args;
  const slug = productArg ? resolveSlug(productArg, KNOWN_SLUGS) : null;
  if (!slug) return `Producto no reconocido. Usa uno de: ${KNOWN_SLUGS.map((s) => `<code>${s}</code>`).join(", ")}`;
  if (!qtyArg || !/^\d{1,6}$/.test(qtyArg)) return "Cantidad inválida. Usa un número entero, ej. <code>/stock marco 12</code>";
  const n = Number(qtyArg);
  if (n > MAX_QTY) return "Cantidad demasiado grande.";

  const { before, after } = await withTransaction(async (conn) => {
    const { rows } = await conn.query<{ qty: number }>("SELECT qty FROM stock WHERE slug = $1 FOR UPDATE", [slug]);
    const current = rows[0] ? Number(rows[0].qty) : 0;
    const target = mode === "set" ? n : mode === "add" ? current + n : current - n;
    return setStockQty(conn, slug, Math.min(target, MAX_QTY), `telegram_${mode}`, actor);
  });
  logger.info("stock.changed", { slug, before, after, actor });
  return `✅ <code>${slug}</code>: ${before} → <b>${after}</b>`;
}

async function pendingOrders(): Promise<string> {
  const orders = await listUnregisteredPaidOrders(20);
  if (orders.length === 0) return "✅ No hay ventas web pendientes de registrar en el SAAS.";
  const lines = orders.map((o) => {
    const total = `Q${(o.total_cents / 100).toFixed(2)}`;
    const flag = o.status === "REVIEW" || o.oversold ? " ⚠️" : "";
    return `• <b>${orderNumber(o.id)}</b>${flag} — ${escapeHtml(o.customer_name)} — ${total}`;
  });
  return [`<b>Pendientes de registrar (${orders.length})</b>`, ...lines].join("\n");
}

async function registerOrder(arg: string | undefined, actor: string): Promise<string> {
  const m = /^(?:LW|ZW)-?(\d{1,10})$/i.exec(arg ?? "");
  if (!m) return "Formato: <code>/registrado LW-00012</code>";
  const id = Number(m[1]);
  const ok = await markRegistered(id, actor);
  return ok ? `✅ ${orderNumber(id)} marcado como registrado en el SAAS.` : `No encontré ${orderNumber(id)} pendiente de registrar.`;
}
