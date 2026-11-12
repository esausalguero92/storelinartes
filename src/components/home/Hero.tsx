import Image from "next/image";
import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/utils";
import { SITE, WA_MESSAGES } from "@/config/site";

export default function Hero() {
  return (
    <section className="bg-cream" aria-labelledby="hero-title">
      <div className="grid lg:grid-cols-2 lg:min-h-[640px]">
        <div className="flex items-center order-2 lg:order-1">
          <div className="container-site lg:!max-w-none lg:pl-[max(2.5rem,calc((100vw_-_1320px)/2_+_2.5rem))] lg:pr-16 py-14 md:py-20">
            <span className="eyebrow animate-fade-in">Personalización · Diseño · Presentación premium</span>
            <h1 id="hero-title" className="h-display mt-5 max-w-xl animate-fade-up">
              Regalos personalizados que <em className="font-normal italic text-olive">sí</em> se sienten especiales.
            </h1>
            <p className="mt-6 max-w-md text-base md:text-lg leading-relaxed text-bark">
              Diseñamos detalles únicos para personas y empresas que quieren regalar algo más que un producto.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/tienda" className="btn-primary">Ver la tienda</Link>
              <a href={buildWhatsAppUrl(SITE.whatsapp, WA_MESSAGES.personalizar)} target="_blank" rel="noopener noreferrer" className="btn-outline">
                Quiero personalizar
              </a>
            </div>
          </div>
        </div>
        <div className="relative order-1 lg:order-2 aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto">
          {/* PENDIENTE: reemplazar por una foto real de Linartes (ej. /images/linartes/hero.jpg) */}
          <Image
            src="/images/linartes/hero.svg"
            alt="Regalo personalizado Linartes — foto temporal"
            fill
            priority
            unoptimized
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
