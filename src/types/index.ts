import type { CategorySlug } from "@/config/site";

// ─── Product Types ────────────────────────────────────────────────────────────

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductFeature {
  icon: string;
  label: string;
  description?: string;
}

export interface ProductSpec {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  price: number;
  priceOriginal?: number;
  currency: string;
  images: ProductImage[];
  features: ProductFeature[];
  includes?: string[];
  specs?: ProductSpec[];
  badge?: string;
  badgeType?: "gold" | "white" | "new" | "hot";
  /** Categoría principal (se muestra en tarjetas y ficha). */
  category: string;
  /** Categorías de la tienda donde aparece (filtros de /tienda). */
  categories: CategorySlug[];
  /** true → el precio se muestra como "Desde Q…" (varía según personalización). */
  priceFrom?: boolean;
  /** Qué se puede personalizar (nombres, fechas, logos…). */
  personalization?: string[];
  tags: string[];
  whatsappMessage: string;
  inStock: boolean;
  featured: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

// ─── Contact Types ────────────────────────────────────────────────────────────

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// ─── Section Types ────────────────────────────────────────────────────────────

export type AnimationVariant = "fade-up" | "fade-in" | "slide-left" | "slide-right";

// ─── Checkout Types ───────────────────────────────────────────────────────────

export type StockStatus = "available" | "low" | "soldout";

/** Datos de compra que el servidor entrega a la landing del producto. */
export interface PurchaseInfo {
  enabled: boolean;
  status: StockStatus;
  maxQty: number;
  shippingCityGTQ: number;
  shippingInteriorGTQ: number;
  turnstileSiteKey: string;
}
