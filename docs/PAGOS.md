# Compra en línea — Guía de puesta en marcha

Pago con **Recurrente**, stock propio en **Postgres de Supabase**, avisos por **Telegram** y **correo propio (SMTP)**.
La web **no** se conecta al SAAS: el equipo registra ahí cada venta web al recibir el aviso.

> Mientras `CHECKOUT_ENABLED` no sea `true`, la página se ve y funciona exactamente como antes (solo WhatsApp).

---

## 1. Cómo funciona

```
Cliente → "Comprar ahora" (landing del producto)
        → formulario de envío + verificación anti-bots (Turnstile)
        → POST /api/checkout
              · valida datos (zod, campos estrictos)
              · precio calculado en el servidor (nunca el del navegador)
              · verifica stock (qty − colchón) y crea el pedido PENDING_PAYMENT
              · crea el cobro en Recurrente → redirige al pago
Recurrente → POST /api/webhooks/recurrente (firma Svix)
              · idempotente (svix-id único) · confirma el cobro contra la API
              · valida monto y moneda (si no cuadra → REVIEW)
              · descuenta stock en transacción con bloqueo de filas
              · encola avisos: Telegram equipo, correo equipo, correo cliente
Cron (5 min) → POST /api/cron/notifications → reintentos + expira pedidos no pagados
Equipo → bot de Telegram: /stock, /sumar, /restar, /pedidos, /registrado
```

## 2. Pasos en Hostinger

1. **Base de datos (Supabase)**: crear el proyecto en supabase.com (región más cercana, ej. `us-east-1`).
   SQL Editor → New query → pegar `db/schema.sql` → Run.
   Luego Project Settings → Database → Connection string → **Session pooler** (URI, compatible con IPv4)
   → copiarla en `DATABASE_URL` reemplazando `[YOUR-PASSWORD]`.
   El esquema activa RLS sin políticas: la API REST pública de Supabase no puede leer pedidos.
   La app **no** usa las llaves `anon` / `service_role`; no hace falta ponerlas en ninguna variable.
2. **Variables de entorno**: hPanel → tu app Node.js → Variables de entorno.
   Copiar las del bloque "COMPRA EN LÍNEA" de `.env.local.example` y llenarlas.
   Además: **`NODE_ENV=production`** (sin esto `server.js` arranca en modo desarrollo).
3. **Cron**: hPanel → Avanzado → Cron Jobs → cada 5 minutos:
   ```
   curl -s -X POST -H "Authorization: Bearer TU_CRON_SECRET" https://zora.gt/api/cron/notifications
   ```
4. **Desplegar** (GitHub → Hostinger). En el build se instalan las dependencias nuevas.

## 3. Recurrente

**Pruebas (sandbox)**
1. Panel de Recurrente → Configuración → Llaves API → **Pruebas (Sandbox)** → crear/abrir un Sandbox → crear llave (`sk_test_…`, se muestra una sola vez).
2. Ponerla en `RECURRENTE_SECRET_KEY` de `.env.local` y verificar: `npm run recurrente -- check`.
3. Exponer tu PC con un túnel (Recurrente no acepta URLs locales): `cloudflared tunnel --url http://localhost:3000`.
4. Crear el webhook de PRUEBA y guardar su secreto automáticamente: `npm run recurrente -- webhook https://<tu-tunel>.trycloudflare.com`.
5. Reiniciar `npm run dev`. Tarjetas: `4242 4242 4242 4242` (éxito), `4000 0000 0000 0002` (rechazo), cualquier fecha futura y CVC.
6. Al terminar: `npm run recurrente -- list` y `npm run recurrente -- delete ep_…`.

**Producción**
- Llave **live** en las variables de hPanel (nunca en `.env.local`).
- Webhook live a `https://zora.gt/api/webhooks/recurrente` (Configuración → Desarrolladores y API → Webhooks) y su `whsec_…` en `RECURRENTE_WEBHOOK_SECRET`.
- Eventos usados: `intent.succeeded`, `intent.failed`, `refund.create`, `dispute.create`.

## 4. Cloudflare Turnstile (anti-bots, gratis)

dash.cloudflare.com → Turnstile → Add site → dominio `zora.gt` (y `www.zora.gt`) → modo *Managed*.
Copiar **Site key** → `TURNSTILE_SITE_KEY` y **Secret key** → `TURNSTILE_SECRET_KEY`.

## 5. Telegram

1. Hablar con **@BotFather** → `/newbot` → copiar el token → `TELEGRAM_BOT_TOKEN`.
2. Crear el grupo del equipo y agregar el bot.
3. Inventar un secreto (16+ caracteres) → `TELEGRAM_WEBHOOK_SECRET`.
4. Obtener el ID del grupo (escribir algo en el grupo primero):
   ```
   TELEGRAM_BOT_TOKEN=xxx npm run telegram:setup -- --chat-ids
   ```
   Poner el ID (ej. `-1001234567890`) en `TELEGRAM_TEAM_CHAT_ID` y `TELEGRAM_ALLOWED_CHAT_IDS`.
5. Registrar el webhook (después de desplegar):
   ```
   TELEGRAM_BOT_TOKEN=xxx TELEGRAM_WEBHOOK_SECRET=yyy SITE_URL=https://zora.gt npm run telegram:setup
   ```
6. Opcional: `TELEGRAM_ADMIN_USER_IDS` = IDs de quienes pueden cambiar stock.

Comandos: `/stock` · `/stock tarro 12` · `/sumar cafe 5` · `/restar ahumador 1` · `/pedidos` · `/registrado ZW-00012`

## 6. Correo (SMTP propio)

Crear el buzón `notificaciones@zora.gt` en hPanel → Correos. Variables `SMTP_*`, `MAIL_FROM`, `MAIL_TEAM_TO`.
Verificar en DNS de zora.gt que existan **SPF**, **DKIM** y **DMARC** (hPanel → Correos → Configuración DNS).

## 7. Activar

1. Cargar stock con el bot: `/stock ahumador 10`, etc. (el colchón por defecto es 1 unidad).
2. `CHECKOUT_ENABLED=true` → reiniciar la app.
3. Compra de prueba completa en modo test → revisar Telegram, correos y `/pedidos`.

## 8. Seguridad implementada

| Riesgo | Mitigación |
|---|---|
| Inyección SQL | Solo consultas parametrizadas (`$1, $2…`), una sentencia por consulta, validación estricta de entradas |
| Base expuesta por Supabase | RLS activo sin políticas + `REVOKE` a `anon`/`authenticated`; conexión TLS; la app no usa la API REST |
| Manipular el precio | El navegador no envía precios; el servidor los calcula y Recurrente cobra ese monto; el webhook compara monto pagado vs. total |
| Webhook falso / replay | Firma HMAC-SHA256 (Svix) sobre el cuerpo crudo, ventana de 5 min, confirmación contra la API de Recurrente |
| Doble procesamiento | `svix-id` único + estado del pedido dentro de la misma transacción |
| Vender sin stock | Bloqueo de filas (`FOR UPDATE`) + colchón de seguridad; si se paga sin stock, se marca y se avisa |
| CSRF | Solo POST JSON con `Origin` del propio dominio |
| Bots / abuso | Turnstile verificado en servidor + rate limit por IP |
| XSS | CSP con nonce (sin `unsafe-inline`/`unsafe-eval` en scripts), escape HTML en correos y Telegram |
| Inyección en correos | Se eliminan saltos de línea de nombres, correos y asuntos |
| Secretos | Solo en variables de entorno del servidor; nunca `NEXT_PUBLIC_`; logs con redacción |
| Bot de Telegram | Cabecera secreta + chats y usuarios autorizados |
| Datos de tarjeta | Nunca pasan por el servidor (checkout alojado de Recurrente) |

## 9. Pruebas

```
npm test          # pruebas unitarias (firma, validación, stock, escape)
npm run build     # compila y revisa tipos
```
