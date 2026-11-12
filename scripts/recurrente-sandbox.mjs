#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Herramienta para el SANDBOX de Recurrente (solo pruebas).
// Lee RECURRENTE_SECRET_KEY de .env.local (no hace falta pegarla en la terminal).
//
//   npm run recurrente -- check                 → verifica que la llave sea de PRUEBA
//   npm run recurrente -- webhook <url-publica> → crea el webhook y guarda el whsec_ en .env.local
//   npm run recurrente -- list                  → lista los webhooks del sandbox
//   npm run recurrente -- delete <ep_id>        → borra un webhook
//   npm run recurrente -- simular-pago          → (sin túnel) confirma el último pedido pagado
//                                                  enviando un webhook firmado a localhost
//
// Por seguridad, se niega a trabajar si la llave es de PRODUCCIÓN (live).
// Docs: https://docs.recurrente.com/guides-english/guides/sandboxes-and-test-clocks
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "node:fs";
import { createHmac, randomUUID } from "node:crypto";

const ENV_FILE = ".env.local";
const API = process.env.RECURRENTE_API_URL ?? "https://app.recurrente.com/api";

function readEnv() {
  let text = "";
  try {
    text = readFileSync(ENV_FILE, "utf8");
  } catch {
    fail(`No encontré ${ENV_FILE}. Corre este comando dentro de la carpeta del proyecto.`);
  }
  const m = text.match(/^RECURRENTE_SECRET_KEY=(.*)$/m);
  const key = (m?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
  if (!key || key === "PENDIENTE") fail(`Pon tu llave de prueba (sk_test_...) en RECURRENTE_SECRET_KEY dentro de ${ENV_FILE}.`);
  return { text, key };
}

function envValue(text, name) {
  const m = text.match(new RegExp(`^${name}=(.*)$`, "m"));
  return (m?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
}

function fail(msg) {
  console.error(`✘ ${msg}`);
  process.exit(1);
}

async function api(key, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "X-SECRET-KEY": key, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  let data;
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    data = { raw: txt.slice(0, 300) };
  }
  if (!res.ok) fail(`Recurrente respondió HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}

async function assertTestKey(key) {
  const info = await api(key, "GET", "/test");
  const env = info.environment ?? (info.live_mode === false ? "test" : "desconocido");
  if (info.live_mode === true || env === "live") {
    fail("Esta llave es de PRODUCCIÓN (live). Para pruebas usa una llave creada en Pruebas (Sandbox).");
  }
  return { env, sandboxId: info.sandbox_id ?? null };
}

const [cmd, arg] = process.argv.slice(2);
const { text, key } = readEnv();

if (!cmd || cmd === "check") {
  const { env, sandboxId } = await assertTestKey(key);
  console.log(`✔ Llave válida de PRUEBA · entorno: ${env}${sandboxId ? ` · sandbox: ${sandboxId}` : ""}`);
  if (env === "legacy_test") console.log("  Aviso: es una llave de prueba antigua. Recurrente recomienda crear una dentro de un Sandbox.");
  process.exit(0);
}

if (cmd === "webhook") {
  if (!arg) fail("Falta la URL pública. Ej: npm run recurrente -- webhook https://algo.trycloudflare.com");
  let url;
  try {
    url = new URL(arg);
  } catch {
    fail("URL inválida.");
  }
  if (url.protocol !== "https:") fail("La URL debe ser https (usa el túnel de cloudflared).");
  if (!url.pathname.endsWith("/api/webhooks/recurrente")) url = new URL("/api/webhooks/recurrente", url.origin);

  await assertTestKey(key);
  const ep = await api(key, "POST", "/webhook_endpoints", {
    url: url.toString(),
    description: "Linartes local (pruebas)",
  });
  const secret = ep.signingSecret ?? ep.signing_secret;
  if (!secret) fail("Recurrente no devolvió el signingSecret. Búscalo en el panel de webhooks (Svix).");

  const updated = /^RECURRENTE_WEBHOOK_SECRET=.*$/m.test(text)
    ? text.replace(/^RECURRENTE_WEBHOOK_SECRET=.*$/m, `RECURRENTE_WEBHOOK_SECRET=${secret}`)
    : `${text.trimEnd()}\nRECURRENTE_WEBHOOK_SECRET=${secret}\n`;
  writeFileSync(ENV_FILE, updated, "utf8");

  console.log(`✔ Webhook de PRUEBA creado: ${ep.id}`);
  console.log(`  URL: ${url}`);
  console.log(`  Secreto guardado en ${ENV_FILE} (RECURRENTE_WEBHOOK_SECRET).`);
  console.log("  Reinicia `npm run dev` para que tome el secreto nuevo.");
  process.exit(0);
}

if (cmd === "list") {
  await assertTestKey(key);
  const data = await api(key, "GET", "/webhook_endpoints");
  const list = Array.isArray(data) ? data : data.data ?? data.webhook_endpoints ?? [];
  if (!list.length) console.log("No hay webhooks en este sandbox.");
  for (const ep of list) console.log(`${ep.id}  ${ep.disabled ? "(desactivado) " : ""}${ep.url}`);
  process.exit(0);
}

if (cmd === "delete") {
  if (!arg || !/^ep_[A-Za-z0-9]+$/.test(arg)) fail("Uso: npm run recurrente -- delete ep_xxxxx");
  await assertTestKey(key);
  await api(key, "DELETE", `/webhook_endpoints/${arg}`);
  console.log(`✔ Webhook ${arg} eliminado.`);
  process.exit(0);
}

if (cmd === "simular-pago") {
  // Solo para pruebas SIN túnel: Recurrente no puede llamar a localhost, así que este
  // comando hace de "Recurrente": busca el último pedido pendiente, confirma con la API
  // real del sandbox que de verdad se pagó, y envía a tu web local el mismo aviso
  // firmado (Svix) que enviaría Recurrente. La web lo verifica igual que en producción.
  await assertTestKey(key);
  const whsec = envValue(text, "RECURRENTE_WEBHOOK_SECRET");
  if (!whsec.startsWith("whsec_") || whsec === "whsec_PENDIENTE") fail("Falta RECURRENTE_WEBHOOK_SECRET (whsec_...) en .env.local.");
  const local = (arg ?? "http://localhost:3000").replace(/\/$/, "");
  if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(local)) fail("simular-pago solo envía a tu web local (http://localhost:3000).");

  const { default: pg } = await import("pg");
  const dbUrl = envValue(text, "DATABASE_URL");
  const ssl = envValue(text, "DATABASE_SSL") === "false" ? false : { rejectUnauthorized: false };
  const client = new pg.Client(
    dbUrl
      ? { connectionString: dbUrl.replace(/[?&]sslmode=[^&]*/, ""), ssl }
      : {
          host: envValue(text, "DATABASE_HOST") || "127.0.0.1",
          port: Number(envValue(text, "DATABASE_PORT") || 5432),
          user: envValue(text, "DATABASE_USER"),
          password: envValue(text, "DATABASE_PASSWORD"),
          database: envValue(text, "DATABASE_NAME") || "postgres",
          ssl,
        },
  );
  await client.connect().catch((e) => fail(`No pude conectar a la base de datos (${e.code ?? e.message}). ¿Está bien el DATABASE_URL / DATABASE_* de .env.local?`));
  const { rows } = await client.query(
    "SELECT id::int AS id, recurrente_checkout_id AS ch, total_cents FROM web_orders WHERE status = 'PENDING_PAYMENT' AND recurrente_checkout_id IS NOT NULL ORDER BY id DESC LIMIT 1",
  );
  await client.end();
  const order = rows[0];
  if (!order) fail("No hay pedidos pendientes. Haz primero una compra en la web y paga con la tarjeta de prueba.");

  const remote = await api(key, "GET", `/checkouts/${order.ch}`);
  console.log(`Pedido LW-${String(order.id).padStart(5, "0")} · checkout ${order.ch} · estado en Recurrente: ${remote.status}`);
  if (remote.status !== "paid") fail("Ese checkout todavía no está pagado en Recurrente. Completa el pago con 4242 4242 4242 4242 y vuelve a correr el comando.");

  const body = JSON.stringify({
    type: "payment",
    event_type: "intent.succeeded",
    id: `pi_simulado_${order.id}`,
    status: "succeeded",
    amount_in_cents: remote.total_in_cents ?? order.total_cents,
    currency: remote.currency ?? "GTQ",
    checkout: { id: order.ch, status: "paid" },
  });
  const msgId = `msg_local_${randomUUID()}`;
  const ts = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", Buffer.from(whsec.slice(6), "base64")).update(`${msgId}.${ts}.${body}`).digest("base64");

  const res = await fetch(`${local}/api/webhooks/recurrente`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "svix-id": msgId, "svix-timestamp": String(ts), "svix-signature": `v1,${sig}` },
    body,
  });
  if (!res.ok) fail(`Tu web respondió HTTP ${res.status}. Revisa la terminal de npm run dev.`);
  console.log("✔ Aviso de pago entregado. El pedido debe quedar PAGADO y el stock descontado.");
  process.exit(0);
}

fail(`Comando desconocido: ${cmd}. Usa: check | webhook <url> | list | delete <ep_id> | simular-pago`);
