import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const POINTS = ["Empresas y eventos", "Colaboradores y equipos de trabajo", "Clientes", "Desde un detalle individual hasta pedidos para grupos"];

export default function CorporateSplit() {
  return (
    <section className="section-y bg-white" aria-labelledby="corp-title">
      <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <AnimatedSection className="order-2 lg:order-1">
          <span className="eyebrow">Corporativo</span>
          <h2 id="corp-title" className="h-section mt-4">Regalos que hablan bien de tu marca.</h2>
          <p className="mt-6 text-base md:text-lg leading-relaxed text-bark">
            Creamos regalos personalizados para empresas, eventos, colaboradores, clientes y equipos de trabajo.
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] text-bark">
                <Check size={18} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-terra" aria-hidden="true" /> {p}
              </li>
            ))}
          </ul>
          <p className="mt-6 font-display text-lg font-light italic text-olive">
            Personalización con tu identidad visual y presentación cuidada.
          </p>
          <Link href="/corporativo" className="btn-primary mt-8">Ver regalos corporativos</Link>
        </AnimatedSection>
        <AnimatedSection delay={120} className="order-1 lg:order-2 relative aspect-[4/5] max-h-[620px] w-full bg-cream">
          {/* PENDIENTE: foto real de un kit corporativo */}
          <Image src="/images/linartes/corporativo.svg" alt="Regalos corporativos Linartes — foto temporal" fill unoptimized sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
        </AnimatedSection>
      </div>
    </section>
  );
}
