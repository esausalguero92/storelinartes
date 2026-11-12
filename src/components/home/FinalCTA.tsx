import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/utils";
import { SITE, WA_MESSAGES } from "@/config/site";
import AnimatedSection from "@/components/ui/AnimatedSection";

export default function FinalCTA() {
  return (
    <section className="section-y bg-cream" aria-labelledby="cta-title">
      <AnimatedSection className="container-site max-w-3xl text-center">
        <h2 id="cta-title" className="h-display">El próximo regalo especial puede empezar aquí.</h2>
        <p className="mx-auto mt-6 max-w-xl text-base md:text-lg leading-relaxed text-bark">
          Encuentra un detalle pensado para esa persona, esa ocasión o esa empresa que quieres celebrar.
        </p>
        <p className="mt-4 font-display text-xl font-light italic text-olive">Personalízalo. Hazlo tuyo. Hazlo memorable.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/tienda" className="btn-primary">Ver la tienda</Link>
          <a href={buildWhatsAppUrl(SITE.whatsapp, WA_MESSAGES.personalizar)} target="_blank" rel="noopener noreferrer" className="btn-outline">
            Escríbenos por WhatsApp
          </a>
        </div>
      </AnimatedSection>
    </section>
  );
}
