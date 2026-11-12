// ─── Precios en tiempo de ejecución ───────────────────────────────────────────
// Cada producto puede sobreescribir su precio con variables de entorno del
// servidor (sin NEXT_PUBLIC_ → nunca llegan al navegador):
//
//   PRICE_<SLUG>            precio de venta          ej. PRICE_SET_REGALO_PREMIUM=350
//   PRICE_<SLUG>_ORIGINAL   precio tachado (opcional) ej. PRICE_KIT_CORPORATIVO_ORIGINAL=180
//
// <SLUG> = slug en mayúsculas con "-" cambiado por "_". Si la variable no existe
// o es inválida se usa el precio de src/data/products.ts.
// En Hostinger: cambiar la variable y reiniciar la app (no requiere rebuild).

export interface PriceEntry {
  price: number;
  priceOriginal?: number;
}

export function priceEnvKey(slug: string): string {
  return `PRICE_${slug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

function parsePrice(raw: string | undefined): number | undefined {
  const n = parseInt(raw ?? "", 10);
  return Number.isNaN(n) || n <= 0 ? undefined : n;
}

/** Llamar en Server Components o route handlers (lee process.env en cada request). */
export function getRuntimePrice(slug: string, defaults: PriceEntry): PriceEntry {
  const key = priceEnvKey(slug);
  return {
    price: parsePrice(process.env[key]) ?? defaults.price,
    priceOriginal: parsePrice(process.env[`${key}_ORIGINAL`]) ?? defaults.priceOriginal,
  };
}
