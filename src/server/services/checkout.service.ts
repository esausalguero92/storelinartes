import "server-only";
import { randomUUID } from "node:crypto";
import { getProductBySlug } from "@/data/products";
import { getEnv } from "@/server/env";
import { withTransaction } from "@/server/db/pool";
import { deleteUnpaidOrder, insertOrder, lockStock, setOrderCheckoutId } from "@/server/db/repositories";
import { mergeItems, toCents, type CheckoutRequest } from "@/server/domain/checkout-schema";
import { sellableUnits } from "@/server/domain/stock";
import { createCheckout } from "@/server/payments/recurrente";
import { logger } from "@/server/logger";

export type CheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; code: "OUT_OF_STOCK" | "INVALID_PRODUCT" | "TOO_MANY_UNITS" | "PAYMENT_PROVIDER"; message: string; slug?: string };

export async function startCheckout(req: CheckoutRequest, ip: string): Promise<CheckoutResult> {
  const env = getEnv();
  const items = mergeItems(req.items);

  const totalUnits = items.reduce((a, i) => a + i.qty, 0);
  if (totalUnits > env.ORDER_MAX_UNITS) {
    return { ok: false, code: "TOO_MANY_UNITS", message: `Máximo ${env.ORDER_MAX_UNITS} unidades por pedido.` };
  }

  // 1) Precios y nombres SIEMPRE desde el servidor.
  const lines: Array<{ slug: string; name: string; unitPriceCents: number; quantity: number }> = [];
  for (const it of items) {
    const product = getProductBySlug(it.slug);
    if (!product || !product.inStock || product.currency !== "GTQ") {
      return { ok: false, code: "INVALID_PRODUCT", message: "Este producto no está disponible.", slug: it.slug };
    }
    lines.push({ slug: product.slug, name: product.name, unitPriceCents: toCents(product.price), quantity: it.qty });
  }

  const subtotalCents = lines.reduce((a, l) => a + l.unitPriceCents * l.quantity, 0);
  const shippingCents = toCents(req.shipping.type === "CIUDAD" ? env.SHIPPING_CITY_GTQ : env.SHIPPING_INTERIOR_GTQ);
  const totalCents = subtotalCents + shippingCents;
  const publicId = randomUUID();
  const expiresAt = new Date(Date.now() + env.ORDER_EXPIRY_MINUTES * 60_000);

  // 2) Verifica stock y crea el pedido en una transacción.
  const created = await withTransaction(async (conn) => {
    const stock = await lockStock(conn, lines.map((l) => l.slug));
    for (const l of lines) {
      const row = stock.get(l.slug);
      if (!row || sellableUnits(row) < l.quantity) return { outOfStock: l.slug } as const;
    }
    const orderId = await insertOrder(conn, {
      publicId,
      customerName: req.customer.name,
      customerEmail: req.customer.email,
      customerPhone: req.customer.phone,
      shippingType: req.shipping.type,
      department: req.shipping.department,
      municipality: req.shipping.municipality,
      address: req.shipping.address,
      addressReference: req.shipping.reference,
      notes: req.notes,
      subtotalCents,
      shippingCents,
      totalCents,
      clientIp: ip,
      expiresAt,
      items: lines,
    });
    return { orderId } as const;
  });

  if ("outOfStock" in created) {
    return { ok: false, code: "OUT_OF_STOCK", message: "No hay suficientes unidades disponibles.", slug: created.outOfStock };
  }

  // 3) Crea el cobro en Recurrente (fuera de la transacción: es una llamada de red).
  const site = new URL(env.SITE_URL).origin;
  try {
    const checkoutLines = lines.map((l) => ({ name: l.name, amountInCents: l.unitPriceCents, quantity: l.quantity }));
    if (shippingCents > 0) {
      checkoutLines.push({
        name: req.shipping.type === "CIUDAD" ? "Envío (Ciudad)" : "Envío (Interior)",
        amountInCents: shippingCents,
        quantity: 1,
      });
    }
    const checkout = await createCheckout({
      lines: checkoutLines,
      successUrl: `${site}/pedido?estado=exitoso&ref=${publicId}`,
      cancelUrl: `${site}/pedido?estado=cancelado&ref=${publicId}`,
      expiresAt,
      metadata: { order_ref: publicId },
    });
    await setOrderCheckoutId(created.orderId, checkout.id);
    logger.info("checkout.created", { orderId: created.orderId, checkoutId: checkout.id, totalCents });
    return { ok: true, checkoutUrl: checkout.checkoutUrl };
  } catch (err) {
    logger.error("checkout.provider_error", { orderId: created.orderId, error: String(err) });
    await deleteUnpaidOrder(created.orderId).catch(() => undefined);
    return { ok: false, code: "PAYMENT_PROVIDER", message: "No pudimos iniciar el pago. Intenta de nuevo en unos minutos." };
  }
}
