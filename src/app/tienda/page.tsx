import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/data/products";
import { CATEGORIES, getCategory, SITE, WA_MESSAGES } from "@/config/site";
import { buildWhatsAppUrl, cn } from "@/lib/utils";
import ProductCard from "@/components/products/ProductCard";
import AnimatedSection from "@/components/ui/AnimatedSection";

export const dynamic = "force-dynamic";

type SP = Promise<{ categoria?: string | string[] }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { categoria } = await searchParams;
  const cat = getCategory(typeof categoria === "string" ? categoria : undefined);
  return {
    title: cat ? `${cat.title} personalizados` : "Tienda de regalos personalizados",
    description: cat
      ? `${cat.title}: ${cat.blurb} Regalos personalizados con envíos a toda Guatemala.`
      : "Regalos personalizados para graduaciones, bodas, empresas y ocasiones especiales. Envíos a toda Guatemala.",
    alternates: { canonical: cat ? `/tienda?categoria=${cat.slug}` : "/tienda" },
  };
}

export default async function TiendaPage({ searchParams }: { searchParams: SP }) {
  const { categoria } = await searchParams;
  const cat = getCategory(typeof categoria === "string" ? categoria : undefined);
  const all = getProducts();
  const products = cat ? all.filter((p) => p.categories.includes(cat.slug)) : all;

  const tabs = [{ slug: undefined as string | undefined, name: "Todos" }, ...CATEGORIES.map((c) => ({ slug: c.slug as string | undefined, name: c.name }))];

  return (
    <div className="bg-white">
      {/* Encabezado */}
      <section className="bg-cream">
        <div className="container-site py-14 md:py-20">
          <nav className="text-[11px] uppercase tracking-label text-stone" aria-label="Ruta">
            <Link href="/" className="hover:text-olive">Inicio</Link> <span aria-hidden="true">/</span>{" "}
            <Link href="/tienda" className="hover:text-olive">Tienda</Link>
            {cat && <> <span aria-hidden="true">/</span> <span className="text-olive">{cat.name}</span></>}
          </nav>
          <h1 className="h-display mt-5">{cat ? cat.title : "Todos los productos"}</h1>
          <p className="mt-4 max-w-xl text-base md:text-lg text-bark">
            {cat ? cat.blurb : "Regalos personalizados que han sido elegidos para celebrar momentos importantes."}
          </p>
        </div>
      </section>

      {/* Filtros */}
      <div className="sticky top-[72px] md:top-[84px] z-30 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="container-site">
          <ul className="-mx-1 flex gap-1 overflow-x-auto py-3 [scrollbar-width:none]" aria-label="Filtrar por categoría">
            {tabs.map((t) => {
              const active = (t.slug ?? null) === (cat?.slug ?? null);
              return (
                <li key={t.name} className="flex-shrink-0">
                  <Link
                    href={t.slug ? `/tienda?categoria=${t.slug}` : "/tienda"}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block px-4 py-2 text-[12px] uppercase tracking-label transition-colors",
                      active ? "bg-olive text-mist" : "text-olive hover:bg-cream",
                    )}
                  >
                    {t.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Productos */}
      <section className="container-site py-12 md:py-16">
        <p className="mb-8 text-sm text-stone">{products.length} {products.length === 1 ? "producto" : "productos"}</p>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <AnimatedSection key={p.id} delay={i * 70}>
                <ProductCard product={p} className="h-full" priority={i < 4} />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-bark">Pronto agregaremos productos en esta categoría.</p>
        )}
      </section>

      {/* ¿No encuentras lo que buscas? */}
      <section className="bg-mist">
        <div className="container-site flex flex-col items-start gap-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-light text-ink">¿Tienes una idea diferente?</h2>
            <p className="mt-2 text-bark">Cuéntanos qué quieres regalar y lo diseñamos contigo.</p>
          </div>
          <a href={buildWhatsAppUrl(SITE.whatsapp, WA_MESSAGES.personalizar)} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Quiero personalizar
          </a>
        </div>
      </section>
    </div>
  );
}
