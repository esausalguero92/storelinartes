import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verificación de firmas Svix (formato que usa Recurrente para sus webhooks).
 * Especificación: https://docs.svix.com/receiving/verifying-payloads/how-manual
 *
 *   contenido firmado = `${svix-id}.${svix-timestamp}.${cuerpo crudo}`
 *   firma            = base64( HMAC-SHA256( base64decode(secret sin "whsec_"), contenido ) )
 *   cabecera         = "v1,<firma> v1,<otra-firma>"  (puede traer varias al rotar el secreto)
 *
 * Sin dependencias externas para que funcione en cualquier versión de Node ≥ 20.
 */

export const SVIX_TOLERANCE_SECONDS = 5 * 60;

export class WebhookVerificationError extends Error {}

export function verifySvixSignature(
  secret: string,
  rawBody: string,
  h: { id: string; timestamp: string; signature: string },
  nowSeconds: number = Math.floor(Date.now() / 1000),
): void {
  if (!h.id || !h.timestamp || !h.signature) throw new WebhookVerificationError("Faltan cabeceras svix");
  if (!/^\d{1,12}$/.test(h.timestamp)) throw new WebhookVerificationError("Timestamp inválido");

  const ts = Number(h.timestamp);
  if (Math.abs(nowSeconds - ts) > SVIX_TOLERANCE_SECONDS) {
    throw new WebhookVerificationError("Timestamp fuera de tolerancia (posible replay)");
  }

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  if (key.length === 0) throw new WebhookVerificationError("Secreto inválido");

  const expected = createHmac("sha256", key).update(`${h.id}.${h.timestamp}.${rawBody}`).digest();

  const ok = h.signature
    .split(" ")
    .map((part) => part.split(","))
    .filter(([version, sig]) => version === "v1" && !!sig)
    .some(([, sig]) => {
      const given = Buffer.from(sig, "base64");
      return given.length === expected.length && timingSafeEqual(given, expected);
    });

  if (!ok) throw new WebhookVerificationError("Firma inválida");
}

/** Solo para pruebas: genera una firma válida. */
export function signSvix(secret: string, id: string, timestamp: number, rawBody: string): string {
  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  return `v1,${createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64")}`;
}
