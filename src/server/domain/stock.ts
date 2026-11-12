/**
 * Reglas de stock (funciones puras, sin BD → fáciles de probar).
 */

export type StockStatus = "available" | "low" | "soldout";

export interface StockRow {
  slug: string;
  qty: number;
  low_threshold: number;
  safety_buffer: number;
}

/** Unidades que la web puede vender (descontando el colchón de seguridad). */
export function sellableUnits(row: Pick<StockRow, "qty" | "safety_buffer">): number {
  return Math.max(0, row.qty - row.safety_buffer);
}

export function stockStatus(row: StockRow | undefined): StockStatus {
  if (!row) return "soldout";
  const units = sellableUnits(row);
  if (units <= 0) return "soldout";
  if (units <= row.low_threshold) return "low";
  return "available";
}

export const STOCK_LABEL: Record<StockStatus, string> = {
  available: "Disponible",
  low: "Últimas unidades",
  soldout: "Agotado",
};

/**
 * Resuelve lo que escribe el equipo en Telegram ("marco", "corporativo", slug completo)
 * a un slug conocido. Devuelve null si no hay coincidencia única.
 */
export function resolveSlug(input: string, knownSlugs: string[]): string | null {
  const q = input.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,80}$/.test(q)) return null;
  if (knownSlugs.includes(q)) return q;
  const matches = knownSlugs.filter((s) => s.split("-").includes(q) || s.startsWith(q));
  return matches.length === 1 ? matches[0] : null;
}
