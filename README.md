# Linartes Design — Tienda en línea

Tienda de regalos personalizados de Linartes, construida con Next.js 15, TypeScript y Tailwind CSS.

## Stack Tecnológico

- **Framework**: Next.js 15 (App Router, render dinámico)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Fuentes**: Inter + Playfair Display (Google Fonts)

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus valores

# 3. Correr en desarrollo
npm run dev
# Abre http://localhost:3000

# 4. Build para producción
npm run build
npm run start
```

## Estructura del proyecto

```
src/
├── app/                    # Páginas (App Router)
│   ├── layout.tsx          # Layout raíz con Header/Footer
│   ├── page.tsx            # Página principal
│   ├── sitemap.ts          # Sitemap automático
│   ├── not-found.tsx       # Página 404
│   ├── productos/
│   │   ├── page.tsx        # Catálogo completo
│   │   └── [slug]/page.tsx # Landing page por producto
│   └── contacto/page.tsx   # Página de contacto
├── components/
│   ├── layout/             # Header, Footer, WhatsAppButton
│   ├── home/               # Hero, ProductsGrid, BrandStatement
│   ├── products/           # ProductCard, ProductLanding
│   └── ui/                 # Button, AnimatedSection
├── data/products.ts        # Catálogo de productos (agregar aquí)
├── types/index.ts          # Tipos TypeScript
└── lib/utils.ts            # Utilidades
```

## Páginas

- `/` Inicio (secciones del documento de estructura) · `/tienda` (filtro `?categoria=`) · `/corporativo` (cotizador por WhatsApp) · `/contacto` · `/productos/[slug]`
- Marca, WhatsApp, redes y categorías: `src/config/site.ts`
- Colores y tipografías: `tailwind.config.ts` y `src/app/globals.css`

## Agregar un nuevo producto

Edita `src/data/products.ts` y agrega un objeto siguiendo la interfaz `Product`
(incluye `categories` para que aparezca en los filtros de la tienda).
El sitio genera automáticamente la landing page en `/productos/[slug]`.
Precio por variable de entorno: `PRICE_<SLUG>` (ver `src/config/prices.ts`).
Fotos: reemplaza las temporales de `public/images/linartes/`.

## Variables de entorno

Ver `.env.local.example` para la lista completa.

## Despliegue en Hostinger (Node.js)

```bash
npm run build
# Subir .next/, public/, package.json, next.config.ts
# En Hostinger: npm start
```

## Compra en línea (Recurrente)

Pago en línea, stock web (Postgres en Supabase), avisos por Telegram y correo.
Guía completa de configuración y seguridad: [`docs/PAGOS.md`](docs/PAGOS.md).

- Código de servidor: `src/server/` (nunca se envía al navegador)
- Esquema de base de datos: `db/schema.sql` (correr en el SQL Editor de Supabase)
- Botón de compra: `src/components/products/BuyBox.tsx`
- Pruebas: `npm test`
