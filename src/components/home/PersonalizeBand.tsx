import Image from "next/image";
import { buildWhatsAppUrl } from "@/lib/utils";
import { SITE, WA_MESSAGES } from "@/config/site";
import AnimatedSection from "@/components/ui/AnimatedSection";

const OPTIONS = ["Nombres", "Iniciales", "Fechas", "Frases", "Logos", "Diseños especiales"];

export default function PersonalizeBand() {
  return (
    <section id="personalizacion" className="bg-olive text-mist scroll-mt-24" aria-labelledby="pers-title">
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[560px]">
          {/* PENDIENTE: foto real de un regalo personalizado */}
          <Image src="/images/linartes/personaliza.svg" alt="Detalle de personalización — foto temporal" fill unoptimized sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
        </div>
        <AnimatedSection className="flex items-center px-[clamp(1rem,5vw,5rem)] py-16 md:py-24">
          <div className="max-w-lg">
            <span className="eyebrow !text-sage-light">Personalización</span>
            <h2 id="pers-title" className="h-section mt-4 !text-mist">Personaliza tu regalo y conviértelo en un detalle único.</h2>
            <ul className="mt-8 flex flex-wrap gap-2.5" aria-label="Opciones de personalización">
              {OPTIONS.map((o) => (
                <li key={o} className="border border-mist/30 px-4 py-2 text-[13px] text-mist">{o}</li>
              ))}
            </ul>
            <a href={buildWhatsAppUrl(SITE.whatsapp, WA_MESSAGES.personalizar)} target="_blank" rel="noopener noreferrer" className="btn-light mt-10">
              Quiero personalizar
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
