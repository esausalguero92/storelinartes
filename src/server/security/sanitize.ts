import { createHash, timingSafeEqual } from "node:crypto";

/** Escapa texto para insertarlo en HTML (correos y mensajes de Telegram con parse_mode HTML). */
export function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Elimina saltos de línea y caracteres de control (anti inyección de cabeceras SMTP). */
export function headerSafe(input: string): string {
  return input.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
}

/** Comparación en tiempo constante para secretos. */
export function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
