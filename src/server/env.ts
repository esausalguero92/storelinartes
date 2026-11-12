import "server-only";
import { z } from "zod";

/**
 * Variables de entorno del servidor, validadas una sola vez.
 * Ninguna lleva prefijo NEXT_PUBLIC_ → nunca llegan al navegador.
 *
 * Si CHECKOUT_ENABLED=false (valor por defecto) la tienda funciona igual que
 * antes (solo WhatsApp) y no se exige ninguna de las credenciales de pago.
 */

const bool = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const intFrom = (def: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? def : Number(v)))
    .pipe(z.number().int().nonnegative());

const list = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  SITE_URL: z.url().default("https://linartes.com"),
  ALLOWED_ORIGINS: list, // orígenes extra permitidos (ej. https://www.linartes.com)

  CHECKOUT_ENABLED: bool,

  // Postgres (Supabase). Opción A: DATABASE_URL (cadena de conexión completa).
  // Opción B: DATABASE_HOST/PORT/USER/PASSWORD/NAME por separado.
  // Valores que no sean una URL postgres:// (vacío, "PENDIENTE"…) se tratan como no definidos.
  DATABASE_URL: z
    .string()
    .optional()
    .transform((v) => (v && /^postgres(ql)?:\/\/.+/i.test(v.trim()) ? v.trim() : "")),
  DATABASE_HOST: z.string().default(""),
  DATABASE_PORT: intFrom(5432),
  DATABASE_USER: z.string().default(""),
  DATABASE_PASSWORD: z.string().default(""),
  DATABASE_NAME: z.string().default("postgres"),
  // TLS: activo por defecto (Supabase lo exige). "false" solo para un Postgres local.
  DATABASE_SSL: z
    .string()
    .optional()
    .transform((v) => !(v === "false" || v === "0")),
  // Opcional: certificado CA de Supabase (PEM) para verificar el servidor.
  DATABASE_CA_CERT: z.string().default(""),

  // Recurrente
  RECURRENTE_SECRET_KEY: z.string().default(""),
  RECURRENTE_WEBHOOK_SECRET: z.string().default(""), // whsec_…
  RECURRENTE_API_URL: z.url().default("https://app.recurrente.com/api"),

  // Envío (quetzales)
  SHIPPING_CITY_GTQ: intFrom(0),
  SHIPPING_INTERIOR_GTQ: intFrom(0),
  ORDER_MAX_UNITS: intFrom(10),
  ORDER_EXPIRY_MINUTES: intFrom(60),

  // Cloudflare Turnstile (anti-bots)
  TURNSTILE_SITE_KEY: z.string().default(""), // pública (se envía al navegador)
  TURNSTILE_SECRET_KEY: z.string().default(""),
  TURNSTILE_DISABLED: bool, // solo para desarrollo local
  TURNSTILE_VERIFY_URL: z.url().default("https://challenges.cloudflare.com/turnstile/v0/siteverify"),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  TELEGRAM_API_URL: z.url().default("https://api.telegram.org"),
  TELEGRAM_WEBHOOK_SECRET: z.string().default(""),
  TELEGRAM_TEAM_CHAT_ID: z.string().default(""),
  TELEGRAM_ALLOWED_CHAT_IDS: list,
  TELEGRAM_ADMIN_USER_IDS: list, // opcional: solo estos usuarios pueden cambiar stock

  // Correo (servidor SMTP propio)
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: intFrom(465),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  MAIL_FROM: z.string().default(""), // ej: Linartes <notificaciones@linartes.com>
  MAIL_TEAM_TO: list, // correos internos que reciben cada pedido

  // Tareas programadas (cron de hPanel)
  CRON_SECRET: z.string().default(""),

  // Proxy: cuántos saltos de proxy confiables hay delante de Node
  TRUSTED_PROXY_HOPS: intFrom(1),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // No imprimimos valores, solo los nombres de las variables con problema.
    const keys = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variables de entorno inválidas: ${keys}`);
  }
  cached = parsed.data;
  return cached;
}

/** Lista de variables obligatorias cuando el checkout está activo. */
export function missingCheckoutConfig(env: ServerEnv = getEnv()): string[] {
  const required: Array<keyof ServerEnv> = env.DATABASE_URL
    ? []
    : ["DATABASE_HOST", "DATABASE_USER", "DATABASE_PASSWORD", "DATABASE_NAME"];
  required.push("RECURRENTE_SECRET_KEY", "RECURRENTE_WEBHOOK_SECRET");
  if (!env.TURNSTILE_DISABLED) required.push("TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY");
  return required.filter((k) => !env[k]);
}

/** El checkout solo se muestra si está activado Y bien configurado. */
export function isCheckoutReady(): boolean {
  try {
    const env = getEnv();
    // En producción la verificación anti-bots es obligatoria.
    if (env.NODE_ENV === "production" && env.TURNSTILE_DISABLED) return false;
    return env.CHECKOUT_ENABLED && missingCheckoutConfig(env).length === 0;
  } catch {
    return false;
  }
}

export function allowedOrigins(env: ServerEnv = getEnv()): string[] {
  return [new URL(env.SITE_URL).origin, ...env.ALLOWED_ORIGINS.map((o) => new URL(o).origin)];
}
