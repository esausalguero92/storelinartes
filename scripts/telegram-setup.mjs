#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Bot de Telegram de Linartes. Lee la configuración de .env.local (o de variables
// de entorno, en Hostinger).
//
//   npm run telegram:setup -- --chat-ids   → busca el grupo y guarda su ID en .env.local
//   npm run telegram:setup -- --test       → envía un mensaje de prueba al grupo
//   npm run telegram:setup                 → registra el webhook (solo con URL pública, ej. https://linartes.com)
//
// Antes de --chat-ids: agrega el bot al grupo y escribe /start en el grupo.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ENV_FILE = ".env.local";
const envText = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";

function get(name) {
  if (process.env[name]) return process.env[name];
  const m = envText.match(new RegExp(`^${name}=(.*)$`, "m"));
  return (m?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
}

function saveEnv(values) {
  if (!existsSync(ENV_FILE)) return false;
  let t = readFileSync(ENV_FILE, "utf8");
  for (const [k, v] of Object.entries(values)) {
    t = new RegExp(`^${k}=.*$`, "m").test(t) ? t.replace(new RegExp(`^${k}=.*$`, "m"), `${k}=${v}`) : `${t.trimEnd()}\n${k}=${v}\n`;
  }
  writeFileSync(ENV_FILE, t, "utf8");
  return true;
}

const fail = (msg) => {
  console.error(`✘ ${msg}`);
  process.exit(1);
};

const token = get("TELEGRAM_BOT_TOKEN");
if (!token) fail(`Falta TELEGRAM_BOT_TOKEN en ${ENV_FILE} (te lo da @BotFather).`);
if (!/^\d{5,15}:[A-Za-z0-9_-]{30,}$/.test(token)) fail("TELEGRAM_BOT_TOKEN no tiene el formato esperado (123456789:ABC...).");

const api = async (method, body) => {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const j = await r.json();
  if (!j.ok) fail(`Telegram (${method}): ${j.description ?? r.status}`);
  return j.result;
};

const me = await api("getMe");
console.log(`Bot: @${me.username}`);

// ── Buscar el grupo y guardar su ID ─────────────────────────────────────────
if (process.argv.includes("--chat-ids")) {
  await api("deleteWebhook", {}); // getUpdates no funciona con webhook activo
  const updates = await api("getUpdates", {});
  const chats = new Map();
  for (const u of updates ?? []) {
    const c = u.message?.chat ?? u.my_chat_member?.chat;
    if (c && (c.type === "group" || c.type === "supergroup")) chats.set(String(c.id), c.title ?? "(sin nombre)");
  }
  if (chats.size === 0) fail("No encontré grupos. Agrega el bot al grupo, escribe /start en el grupo y vuelve a correr el comando.");
  for (const [id, name] of chats) console.log(`  ${id}  ${name}`);
  if (chats.size === 1) {
    const [id] = chats.keys();
    if (saveEnv({ TELEGRAM_TEAM_CHAT_ID: id, TELEGRAM_ALLOWED_CHAT_IDS: id })) {
      console.log(`✔ Guardé el grupo en ${ENV_FILE} (TELEGRAM_TEAM_CHAT_ID y TELEGRAM_ALLOWED_CHAT_IDS).`);
      console.log("  Reinicia `npm run dev` y prueba con: npm run telegram:setup -- --test");
    }
  } else {
    console.log(`Hay varios grupos: copia el ID correcto en TELEGRAM_TEAM_CHAT_ID y TELEGRAM_ALLOWED_CHAT_IDS de ${ENV_FILE}.`);
  }
  process.exit(0);
}

// ── Mensaje de prueba ───────────────────────────────────────────────────────
if (process.argv.includes("--test")) {
  const chat = get("TELEGRAM_TEAM_CHAT_ID");
  if (!chat) fail("Falta TELEGRAM_TEAM_CHAT_ID. Corre primero: npm run telegram:setup -- --chat-ids");
  await api("sendMessage", { chat_id: chat, text: "✅ <b>Linartes</b>: el bot está conectado y listo para avisar ventas.", parse_mode: "HTML" });
  console.log("✔ Mensaje de prueba enviado al grupo.");
  process.exit(0);
}

// ── Registrar el webhook (requiere URL pública) ─────────────────────────────
const secret = get("TELEGRAM_WEBHOOK_SECRET");
const site = get("SITE_URL") || "https://linartes.com";
if (!/^https:\/\//.test(site) || /localhost|127\.0\.0\.1/.test(site)) {
  fail(`SITE_URL es ${site}. Telegram necesita una URL pública https (ej. https://linartes.com). En local usa --chat-ids y --test.`);
}
if (!secret || !/^[A-Za-z0-9_-]{16,256}$/.test(secret)) fail("TELEGRAM_WEBHOOK_SECRET debe tener 16-256 caracteres (A-Z a-z 0-9 _ -).");
await api("setWebhook", {
  url: `${site}/api/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ["message"],
  drop_pending_updates: true,
});
await api("setMyCommands", {
  commands: [
    { command: "stock", description: "Ver o fijar stock: /stock marco 12" },
    { command: "sumar", description: "Sumar unidades: /sumar marco 5" },
    { command: "restar", description: "Restar unidades: /restar marco 1" },
    { command: "pedidos", description: "Ventas web sin registrar en el SAAS" },
    { command: "registrado", description: "Marcar pedido: /registrado LW-00012" },
    { command: "ayuda", description: "Ver comandos" },
  ],
});
console.log(`✔ Webhook registrado en ${site}/api/telegram/webhook`);
