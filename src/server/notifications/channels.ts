import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/server/env";
import { headerSafe } from "@/server/security/sanitize";

// ─── Telegram ────────────────────────────────────────────────────────────────
export async function sendTelegram(chatId: string, html: string): Promise<void> {
  const env = getEnv();
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN no configurado");
  const res = await fetch(`${env.TELEGRAM_API_URL}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: html.slice(0, 4000),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    // El token va en la URL: nunca lo registramos; solo el código de estado.
    throw new Error(`Telegram HTTP ${res.status}`);
  }
}

// ─── Correo (SMTP propio) ────────────────────────────────────────────────────
const globalForMail = globalThis as unknown as { __mailer?: Transporter };

function mailer(): Transporter {
  if (globalForMail.__mailer) return globalForMail.__mailer;
  const env = getEnv();
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.MAIL_FROM) {
    throw new Error("SMTP no configurado");
  }
  const implicitTls = env.SMTP_PORT === 465;
  globalForMail.__mailer = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: implicitTls, // 465 → TLS directo
    requireTLS: !implicitTls, // 587 → STARTTLS obligatorio; nunca en texto plano
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    pool: true,
    maxConnections: 2,
    connectionTimeout: 10000,
    socketTimeout: 20000,
  });
  return globalForMail.__mailer;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string | null): Promise<void> {
  await mailer().sendMail({
    from: getEnv().MAIL_FROM,
    to: headerSafe(to),
    subject: headerSafe(subject).slice(0, 200),
    text,
    html: html ?? undefined,
  });
}
