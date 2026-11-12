import { z } from "zod";
import { GT_DEPARTMENTS } from "@/lib/gt-departments";

/**
 * Esquema estricto del cuerpo que envía el navegador a /api/checkout.
 * - `.strict()` rechaza cualquier campo no esperado (ej. alguien intentando mandar "price").
 * - El navegador NUNCA manda precios: el servidor los calcula.
 * - Se eliminan caracteres de control (incluye CR/LF → evita inyección de cabeceras en correos).
 */

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

const text = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min).max(max));

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((s) => (s ?? "").replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().max(max))
    .transform((s) => (s === "" ? null : s));

export { GT_DEPARTMENTS };

export const checkoutRequestSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            slug: z.string().regex(/^[a-z0-9-]{2,80}$/),
            qty: z.number().int().min(1).max(20),
          })
          .strict(),
      )
      .min(1)
      .max(10),
    customer: z
      .object({
        name: text(3, 120),
        email: z
          .string()
          .trim()
          .toLowerCase()
          .max(160)
          .pipe(z.email()),
        phone: z
          .string()
          .transform((s) => s.replace(/[\s-]/g, ""))
          .pipe(z.string().regex(/^(\+?502)?[2-7]\d{7}$/, "Teléfono de Guatemala inválido")),
      })
      .strict(),
    shipping: z
      .object({
        type: z.enum(["CIUDAD", "INTERIOR"]),
        department: z.enum(GT_DEPARTMENTS),
        municipality: text(2, 80),
        address: text(5, 300),
        reference: optionalText(200),
      })
      .strict(),
    notes: optionalText(500),
    turnstileToken: z.string().max(2048).optional(),
  })
  .strict();

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

/** Agrupa cantidades si el mismo producto viene repetido. */
export function mergeItems(items: CheckoutRequest["items"]): Array<{ slug: string; qty: number }> {
  const map = new Map<string, number>();
  for (const it of items) map.set(it.slug, (map.get(it.slug) ?? 0) + it.qty);
  return [...map.entries()].map(([slug, qty]) => ({ slug, qty }));
}

export function toCents(gtq: number): number {
  return Math.round(gtq * 100);
}
