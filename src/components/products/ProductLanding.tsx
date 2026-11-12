"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Gift, PenTool, Truck } from "lucide-react";
import { buildWhatsAppUrl, cn, formatPrice, getDiscountPercent, isSvg } from "@/lib/utils";
import { SITE } from "@/config/site";
import AnimatedSection from "@/components/ui/AnimatedSection";
import BuyBox from "@/components/products/BuyBox";
import ProductCard from "@/components/products/ProductCard";
import { IconWhatsApp } from "@/components/ui/Icons";
import type { Product, PurchaseInfo } from "@/types";

interface ProductLandingProps {
  product: Product;
  /** Si viene y está habilitado, se muestra el botón de compra en línea. */
  purchase?: PurchaseInfo;
  related?: Product[];
}

const PERKS = [
  { Icon: PenTool, label: "Diseño aprobado antes de producir" },
  { Icon: Gift, label: "Presentación lista para regalar" },
  { Icon: Truck, label: "Envíos a toda Guatemala" },
];

export default function ProductLanding({ product, purchase, related = [] }: ProductLandingProps) {
  const [active, setActive] = useState(0);
  const total = product.images.length;
  const img = product.images[active];
  const discount = getDiscountPercent(product.price, product.priceOriginal);

  // Compra en línea: solo si el servidor la habilitó para este producto.
  const canBuyOnline = !!purchase?.enabled && product.inStock && purchase.status !== "soldout";
  const onlineSoldOut = !!purchase?.enabled && product.inStock && purchase.status === "soldout";
  const availableNow = product.inStock && !onlineSoldOut;
  const availabilityText = !availableNow
    ? "Agotado temporalmente — consúltanos por WhatsApp"
    : purchase?.enabled && purchase.status === "low"
      ? "Últimas unidades disponibles"
      : "Disponible para personalizar";

  const waUrl = buildWhatsAppUrl(SITE.whatsapp, product.whatsappMessage);

  return (
    <article aria-label={product.name}>
      <div className="container-site pt-6 md:pt-8">
        <nav className="text-[11px] uppercase tracking-label text-stone" aria-label="Ruta">
          <Link href="/" className="hover:text-olive">Inicio</Link> <span aria-hidden="true">/</span>{" "}
          <Link href="/tienda" className="hover:text-olive">Tienda</Link> <span aria-hidden="true">/</span>{" "}
          <span className="text-olive">{product.name}</span>
        </nav>
      </div>

      <section className="container-site pt-6 pb-16 md:pb-24">
        <div className="grid product-landing-grid gap-8 xl:gap-16 items-start">
          {/* Galería */}
          <div className="lg:sticky lg:top-28 space-y-3">
            <div className="relative aspect-[4/5] overflow-hidden bg-cream">
              <Image
                key={img.src}
                src={img.src}
                alt={img.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
                unoptimized={isSvg(img.src)}
              />
              {product.badge && (
                <span className="absolute left-4 top-4 bg-white/95 px-3 py-1 text-[10px] font-medium uppercase tracking-label text-olive">{product.badge}</span>
              )}
              {total > 1 && (
                <>
                  <button onClick={() => setActive((i) => (i === 0 ? total - 1 : i - 1))} aria-label="Imagen anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center bg-white/90 text-olive hover:bg-white">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setActive((i) => (i === total - 1 ? 0 : i + 1))} aria-label="Imagen siguiente"
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center bg-white/90 text-olive hover:bg-white">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            {total > 1 && (
              <div className="flex gap-3">
                {product.images.map((im, i) => (
                  <button key={im.src} onClick={() => setActive(i)} aria-label={`Ver imagen ${i + 1}`} aria-pressed={active === i}
                    className={cn("relative h-20 w-16 flex-shrink-0 overflow-hidden bg-cream transition-opacity", active === i ? "ring-1 ring-olive" : "opacity-60 hover:opacity-100")}>
                    <Image src={im.src} alt="" fill sizes="64px" className="object-cover" unoptimized={isSvg(im.src)} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-label text-stone">{product.category}</span>
            <h1 className="mt-3 font-display font-light text-ink" style={{ fontSize: "clamp(2rem, 3.6vw, 3rem)", lineHeight: 1.08 }}>
              {product.name}
            </h1>
            <p className="mt-3 font-display text-lg font-light italic text-olive">{product.tagline}</p>

            <div className="mt-6 flex flex-wrap items-baseline gap-3 border-y border-line py-5">
              {product.priceFrom && <span className="text-sm text-stone">Desde</span>}
              <span className="font-display text-3xl font-light text-terra">{formatPrice(product.price, product.currency)}</span>
              {product.priceOriginal && discount && (
                <>
                  <span className="text-stone line-through">{formatPrice(product.priceOriginal, product.currency)}</span>
                  <span className="bg-terra/10 px-2 py-0.5 text-xs text-terra-dark">Ahorras {discount}%</span>
                </>
              )}
              {product.priceFrom && (
                <p className="basis-full text-xs text-stone">El precio final depende de la personalización y la cantidad.</p>
              )}
            </div>

            <p className="mt-6 text-base leading-relaxed text-bark">{product.description}</p>

            {product.personalization && product.personalization.length > 0 && (
              <div className="mt-7">
                <p className="text-[11px] font-medium uppercase tracking-label text-stone">Puedes personalizar</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {product.personalization.map((p) => <li key={p} className="chip">{p}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <p className="flex items-center gap-2 text-sm">
                <span className={cn("h-2 w-2 rounded-full", availableNow ? "bg-sage" : "bg-stone")} aria-hidden="true" />
                <span className={availableNow ? "text-olive" : "text-stone"}>{availabilityText}</span>
              </p>

              {canBuyOnline && purchase && <BuyBox product={product} purchase={purchase} />}

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(canBuyOnline ? "btn-outline" : "btn-primary", "w-full !py-4")}
                aria-label={`Cotizar o personalizar ${product.name} por WhatsApp`}
              >
                <IconWhatsApp className="h-4 w-4" />
                Cotizar y personalizar por WhatsApp
              </a>
            </div>

            <ul className="mt-8 grid grid-cols-3 gap-px border border-line bg-line">
              {PERKS.map(({ Icon, label }) => (
                <li key={label} className="bg-white px-2 py-4 text-center">
                  <Icon size={20} strokeWidth={1.25} className="mx-auto text-terra" aria-hidden="true" />
                  <span className="mt-2 block text-[11px] leading-tight text-stone">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Detalle */}
      <section className="bg-cream section-y">
        <div className="container-site grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <AnimatedSection>
            <span className="eyebrow">Sobre este regalo</span>
            <h2 className="h-section mt-3">Pensado para esa persona</h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-bark">
              {product.longDescription.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={120} className="space-y-10">
            {product.includes && product.includes.length > 0 && (
              <div>
                <h3 className="text-[11px] font-medium uppercase tracking-label text-stone">Qué incluye</h3>
                <ul className="mt-4 space-y-3">
                  {product.includes.map((it) => (
                    <li key={it} className="flex gap-3 text-[15px] text-bark">
                      <span className="mt-2.5 h-1 w-3 flex-shrink-0 bg-terra" aria-hidden="true" />{it}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.specs && product.specs.length > 0 && (
              <div>
                <h3 className="text-[11px] font-medium uppercase tracking-label text-stone">Detalles</h3>
                <dl className="mt-4 divide-y divide-line border-y border-line">
                  {product.specs.map((s) => (
                    <div key={s.name} className="flex justify-between gap-6 py-3 text-sm">
                      <dt className="text-stone">{s.name}</dt>
                      <dd className="text-right text-ink">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-y">
          <div className="container-site">
            <div className="flex items-end justify-between gap-6">
              <h2 className="h-section">También te puede gustar</h2>
              <Link href="/tienda" className="link-underline hidden sm:inline-flex">Ver la tienda</Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} className="h-full" />)}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
