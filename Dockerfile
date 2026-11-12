# ─────────────────────────────────────────────────────────────────────────────
# Linartes Web Store — imagen de producción (Next.js standalone)
# Easypanel: Build → Dockerfile → archivo "Dockerfile" · Puerto: 3000
# Los secretos (DATABASE_URL, RECURRENTE_*, TELEGRAM_*, SMTP_*…) se configuran
# en Easypanel → Environment. Nunca se copian dentro de la imagen.
# ─────────────────────────────────────────────────────────────────────────────

# 1) Dependencias
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2) Compilación
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables públicas: se incrustan en el JS del navegador al compilar.
# Si no se pasan, se usan los valores por defecto de src/config/site.ts.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG NEXT_PUBLIC_WHATSAPP_DEFAULT_MSG
ARG NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_INSTAGRAM_URL
ARG NEXT_PUBLIC_FACEBOOK_URL
ARG NEXT_PUBLIC_TIKTOK_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_PUBLIC_WHATSAPP_DEFAULT_MSG=$NEXT_PUBLIC_WHATSAPP_DEFAULT_MSG \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_INSTAGRAM_URL=$NEXT_PUBLIC_INSTAGRAM_URL \
    NEXT_PUBLIC_FACEBOOK_URL=$NEXT_PUBLIC_FACEBOOK_URL \
    NEXT_PUBLIC_TIKTOK_URL=$NEXT_PUBLIC_TIKTOK_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_STANDALONE=1

RUN npm run build

# 3) Ejecución (solo lo necesario, usuario sin privilegios)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/robots.txt > /dev/null || exit 1

CMD ["node", "server.js"]
