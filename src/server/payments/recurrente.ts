import "server-only";
import { verifySvixSignature } from "@/server/payments/svix-signature";
import { getEnv } from "@/server/env";

/**
 * Cliente mínimo de la API de Recurrente.
 * Docs: https://docs.recurrente.com
 *  - Auth: cabecera X-SECRET-KEY (la llave define si es test o live).
 *  - Webhooks firmados con Svix (svix-id, svix-timestamp, svix-signature).
 */

export interface CheckoutLine {
  name: string;
  amountInCents: number;
  quantity: number;
}

export interface CreatedCheckout {
  id: string;
  checkoutUrl: string;
}

const CHECKOUT_HOST = "app.recurrente.com";

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const env = getEnv();
  const res = await fetch(`${env.RECURRENTE_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-SECRET-KEY": env.RECURRENTE_SECRET_KEY,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) {
    // Nunca devolvemos este detalle al navegador; solo va al log del servidor.
    throw new Error(`Recurrente ${path} → HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as T;
}

export async function createCheckout(input: {
  lines: CheckoutLine[];
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
  metadata: Record<string, string>;
}): Promise<CreatedCheckout> {
  const body = {
    items: input.lines.map((l) => ({
      name: l.name.slice(0, 120),
      amount_in_cents: l.amountInCents,
      currency: "GTQ",
      quantity: l.quantity,
    })),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    expires_at: input.expiresAt.toISOString(),
    metadata: input.metadata,
  };
  const data = await call<{ id?: string; checkout_url?: string }>("/checkouts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!data.id || !data.checkout_url) throw new Error("Recurrente: respuesta de checkout incompleta");

  // Solo redirigimos al dominio oficial de Recurrente (evita open-redirect si algo raro vuelve).
  const url = new URL(data.checkout_url);
  if (url.protocol !== "https:" || url.hostname !== CHECKOUT_HOST) {
    throw new Error(`Recurrente: checkout_url con host inesperado (${url.hostname})`);
  }
  return { id: data.id, checkoutUrl: url.toString() };
}

export interface RemoteCheckout {
  id: string;
  status: string; // "unpaid" | "paid" | ...
  total_in_cents?: number;
  currency?: string;
}

/** Consulta directa a Recurrente para confirmar el estado real (defensa en profundidad). */
export async function getCheckout(id: string): Promise<RemoteCheckout> {
  if (!/^ch_[A-Za-z0-9]{4,60}$/.test(id)) throw new Error("checkout id inválido");
  return call<RemoteCheckout>(`/checkouts/${encodeURIComponent(id)}`, { method: "GET" });
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export interface RecurrenteEvent {
  id?: string;
  event_type?: string;
  type?: string;
  status?: string;
  amount_in_cents?: number;
  currency?: string;
  checkout?: { id?: string; status?: string };
  customer?: { email?: string; full_name?: string };
}

/**
 * Verifica la firma Svix sobre el cuerpo CRUDO (sin parsear) y luego lo parsea.
 * Lanza error si la firma, el timestamp (±5 min, anti-replay) o las cabeceras no son válidos.
 */
export function verifyWebhook(rawBody: string, headers: Headers): RecurrenteEvent {
  const secret = getEnv().RECURRENTE_WEBHOOK_SECRET;
  if (!secret) throw new Error("RECURRENTE_WEBHOOK_SECRET no configurado");
  verifySvixSignature(secret, rawBody, {
    id: headers.get("svix-id") ?? "",
    timestamp: headers.get("svix-timestamp") ?? "",
    signature: headers.get("svix-signature") ?? "",
  });
  const parsed: unknown = JSON.parse(rawBody);
  if (typeof parsed !== "object" || parsed === null) throw new Error("payload inválido");
  return parsed as RecurrenteEvent;
}
