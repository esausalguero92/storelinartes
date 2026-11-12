import { SITE } from "@/config/site";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Class Merging ────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export function buildWhatsAppUrl(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

export function buildCanonicalUrl(path: string): string {
  const base = SITE.url;
  return `${base}${path}`;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = "GTQ"): string {
  return `${currency} ${amount.toLocaleString("es-GT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Intersection Observer helper ────────────────────────────────────────────
// Used by AnimatedSection component

export function createRevealObserver(): IntersectionObserver | null {
  if (typeof window === "undefined") return null;
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );
}

// ─── Precios (seguros para el navegador) ─────────────────────────────────────

export function formatPrice(price: number, currency = "GTQ"): string {
  return `${currency === "GTQ" ? "Q" : `${currency} `}${price.toLocaleString("es-GT")}`;
}

export function getDiscountPercent(price: number, priceOriginal?: number): number | null {
  if (!priceOriginal || priceOriginal <= price) return null;
  return Math.round(((priceOriginal - price) / priceOriginal) * 100);
}

/** next/image no optimiza SVG: se sirven tal cual. */
export function isSvg(src: string): boolean {
  return src.toLowerCase().endsWith(".svg");
}
