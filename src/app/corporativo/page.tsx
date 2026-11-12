import type { Metadata } from "next";
import Image from "next/image";
import { Briefcase, CalendarHeart, Handshake, Users } from "lucide-react";
import { getProducts } from "@/data/products";
import { buildWhatsAppUrl } from "@/lib/utils";
import { SITE, WA_MESSAGES } from "@/config/site";
import ProductCard from "@/components/products/ProductCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";
import QuoteForm from "@/components/corporate/QuoteForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regalos corporativos personalizados",
  description:
    "Regalos personalizados para empresas, eventos, colaboradores, clientes y equipos de trabajo. Pedidos por volumen con tu identidad visual. Envíos a toda Guatemala.",
  alternates: { canonical: "/corporativo" },
};

const SOLUTIONS = [
  { Icon: Users, title: "Colaboradores y equipos", body: "Bienvenidas, aniversarios laborales y reconocimientos para tu equipo de trabajo." },
  { Icon: Handshake, title: "Clientes", body: "Detalles que fortalecen la relación y dejan una buena impresión de tu marca." },
  { Icon: CalendarHeart, title: "Eventos", body: "Regalos para lanzamientos, conferencias, celebraciones y fechas especiales." },
  { Icon: Briefcase, title: "Identidad de marca", body: "Personalización con tu logotipo, colores y mensaje, con presentación cuidada." },
];

const VOLUME_STEPS = [
  { title: "Cuéntanos", body: "Cantidad, fecha, ocasión y presupuesto aproximado." },
  { title: "Propuesta", body: "Te enviamos opciones de productos y personalización." },
  { title: "Aprobación", body: "Confirmas el diseño con tu identidad visual antes de producir." },
  { title: "Entrega", body: "Preparamos el pedido y coordinamos la entrega en toda Guatemala." },
];

export default function CorporativoPage() {
  const all = getProducts();
  const corporate = all.filter((p) => p.categories.includes("corporativos"));
  const others = all.filter((p) => !p.categories.includes("corporativos"));
  const showcase = [...corporate, ...others].slice(0, 4);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-olive text-mist">
        <div className="grid lg:grid-cols-2">
          <div className="container-site lg:!max-w-none lg:pl-[max(2.5rem,calc((100vw_-_1320px)/2_+_2.5rem))] lg:pr-16 py-16 md:py-24 flex flex-col justify-center">
            <span className="eyebrow !text-sage-light">Corporativo</span>
            <h1 className="h-display mt-5 !text-mist max-w-xl">Regalos que hablan bien de tu marca.</h1>
            <p className="mt-6 max-w-md text-base md:text-lg leading-relaxed text-mist/85">
              Creamos regalos personalizados para empresas, eventos, colaboradores, clientes y equipos de trabajo.
              Desde un detalle individual hasta pedidos para eventos y grupos.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#cotizacion" className="btn-light">Solicitar cotización</a>
              <a href="#productos" className="btn-ghost-light">Ver productos</a>
            </div>
          </div>
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[560px]">
            {/* PENDIENTE: foto real de regalos corporativos */}
            <Image src="/images/linartes/corporativo.svg" alt="Regalos corporativos Linartes — foto temporal" fill priority unoptimized sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Soluciones */}
      <section id="soluciones" className="section-y scroll-mt-24">
        <div className="container-site">
          <SectionHeading eyebrow="Soluciones empresariales" title="Un regalo para cada relación de tu empresa" intro="Personalización con tu identidad visual y presentación cuidada." />
          <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {SOLUTIONS.map(({ Icon, title, body }, i) => (
              <AnimatedSection key={title} delay={i * 80} className="bg-white p-8">
                <Icon size={26} strokeWidth={1.25} className="text-terra" aria-hidden="true" />
                <h3 className="mt-5 font-display text-xl font-light text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{body}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Productos */}
      <section id="productos" className="section-y bg-cream scroll-mt-24">
        <div className="container-site">
          <SectionHeading eyebrow="Productos" title="Ideas para regalar en tu empresa" intro="Todos los productos se pueden personalizar con tu logotipo y mensaje." />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {showcase.map((p, i) => (
              <AnimatedSection key={p.id} delay={i * 80}>
                <ProductCard product={p} className="h-full" />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pedidos por volumen */}
      <section id="volumen" className="section-y scroll-mt-24">
        <div className="container-site">
          <SectionHeading align="center" eyebrow="Pedidos por volumen" title="Desde un detalle individual hasta pedidos para eventos y grupos." />
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VOLUME_STEPS.map((s, i) => (
              <AnimatedSection as="li" key={s.title} delay={i * 80} className="border-t border-olive pt-6">
                <span className="font-display text-3xl font-light text-terra">0{i + 1}</span>
                <h3 className="mt-3 font-display text-xl font-light text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{s.body}</p>
              </AnimatedSection>
            ))}
          </ol>
        </div>
      </section>

      {/* Cotización */}
      <section id="cotizacion" className="section-y bg-mist scroll-mt-24">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <div>
            <span className="eyebrow">Cotización</span>
            <h2 className="h-section mt-4">Cuéntanos qué necesitas.</h2>
            <p className="mt-5 text-base leading-relaxed text-bark">
              Llena el formulario y te enviamos una propuesta por WhatsApp. Si prefieres, escríbenos directamente.
            </p>
            <a href={buildWhatsAppUrl(SITE.whatsapp, WA_MESSAGES.corporativo)} target="_blank" rel="noopener noreferrer" className="link-underline mt-8">
              Escribir por WhatsApp
            </a>
          </div>
          <div className="bg-white p-6 md:p-10">
            <QuoteForm productNames={all.map((p) => p.name)} />
          </div>
        </div>
      </section>
    </div>
  );
}
