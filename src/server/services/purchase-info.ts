import "server-only";
import { getEnv, isCheckoutReady } from "@/server/env";
import { getStock } from "@/server/db/repositories";
import { sellableUnits, stockStatus } from "@/server/domain/stock";
import { logger } from "@/server/logger";
import type { PurchaseInfo } from "@/types";

/**
 * Información de compra para la landing de un producto.
 * Si el checkout está apagado o la BD no responde, devuelve undefined y la
 * página se ve exactamente como antes (solo WhatsApp).
 */
export async function getPurchaseInfo(slug: string): Promise<PurchaseInfo | undefined> {
  if (!isCheckoutReady()) return undefined;
  try {
    const env = getEnv();
    const row = await getStock(slug);
    const status = stockStatus(row);
    return {
      enabled: true,
      status,
      // No revelamos el stock exacto: el selector llega como máximo a 5 (o a lo que haya).
      maxQty: row ? Math.min(sellableUnits(row), 5, env.ORDER_MAX_UNITS) : 0,
      shippingCityGTQ: env.SHIPPING_CITY_GTQ,
      shippingInteriorGTQ: env.SHIPPING_INTERIOR_GTQ,
      turnstileSiteKey: env.TURNSTILE_DISABLED ? "" : env.TURNSTILE_SITE_KEY,
    };
  } catch (err) {
    logger.error("purchase_info.error", { slug, error: String(err) });
    return undefined;
  }
}
