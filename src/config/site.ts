// ─── Datos de la marca Linartes ───────────────────────────────────────────────
// Valores públicos (se pueden ajustar con variables NEXT_PUBLIC_* en .env).

export const SITE = {
  name: "Linartes",
  fullName: "Linartes Design",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://linartes.com",
  tagline: "Regalos personalizados que sí se sienten especiales.",
  description:
    "Diseñamos detalles únicos para personas y empresas que quieren regalar algo más que un producto. Personalización, diseño y presentación premium con envíos a toda Guatemala.",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "50238606934",
  whatsappDefaultMsg:
    process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MSG ?? "¡Hola Linartes! Quiero información sobre sus regalos personalizados.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://www.facebook.com/linartesDesign/",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/linartes_design/",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "",
} as const;

export const WA_MESSAGES = {
  personalizar: "¡Hola Linartes! Quiero personalizar un regalo. ¿Me ayudan?",
  corporativo: "¡Hola Linartes! Quiero cotizar regalos corporativos para mi empresa.",
  general: SITE.whatsappDefaultMsg,
} as const;

// ─── Categorías de la tienda ──────────────────────────────────────────────────

export type CategorySlug = "graduaciones" | "corporativos" | "regalos-especiales" | "bodas" | "sets";

export interface Category {
  slug: CategorySlug;
  name: string;      // nombre corto (menú, filtros)
  title: string;     // nombre largo (tarjetas)
  blurb: string;
}

export const CATEGORIES: Category[] = [
  { slug: "graduaciones",       name: "Graduaciones",       title: "Graduaciones",              blurb: "Para celebrar un logro que se recuerda toda la vida." },
  { slug: "corporativos",       name: "Corporativos",       title: "Regalos corporativos",      blurb: "Detalles con la identidad de tu marca." },
  { slug: "regalos-especiales", name: "Regalos especiales", title: "Regalos especiales",        blurb: "Para esa persona y esa ocasión." },
  { slug: "bodas",              name: "Bodas",              title: "Bodas & damas de honor",    blurb: "Detalles para el día más importante." },
  { slug: "sets",               name: "Sets",               title: "Sets personalizados",       blurb: "Combinaciones completas, listas para regalar." },
];

export function getCategory(slug: string | undefined | null): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

// ─── Navegación ───────────────────────────────────────────────────────────────

export const NAV = [
  { label: "Inicio", href: "/" },
  { label: "Tienda", href: "/tienda", children: [
      { label: "Todos los productos", href: "/tienda" },
      ...CATEGORIES.map((c) => ({ label: c.name, href: `/tienda?categoria=${c.slug}` })),
    ] },
  { label: "Corporativo", href: "/corporativo" },
  { label: "Contacto", href: "/contacto" },
];
