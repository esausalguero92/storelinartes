/**
 * Logs estructurados en JSON (una línea por evento) → legibles en los logs de
 * la app Node de Hostinger y fáciles de enviar a un servicio externo después.
 * Nunca registrar: contraseñas, tokens, llaves, datos de tarjeta.
 */
type Level = "info" | "warn" | "error";

const REDACT = /(password|secret|token|key|authorization|signature)/i;

function clean(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) out[k] = REDACT.test(k) ? "[redacted]" : v;
  return out;
}

function write(level: Level, event: string, meta: Record<string, unknown> = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...clean(meta) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => write("info", event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => write("warn", event, meta),
  error: (event: string, meta?: Record<string, unknown>) => write("error", event, meta),
};
