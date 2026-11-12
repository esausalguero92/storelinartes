import { Gift, MessageCircle, PenTool, Truck } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";

const ITEMS = [
  { Icon: Gift, big: "+1,000", label: "regalos personalizados entregados" },
  { Icon: PenTool, big: "Diseños", label: "personalizados" },
  { Icon: Truck, big: "Envíos", label: "a toda Guatemala" },
  { Icon: MessageCircle, big: "Atención", label: "personalizada" },
];

export default function Trust() {
  return (
    <section className="section-y bg-white" aria-labelledby="trust-title">
      <div className="container-site">
        <SectionHeading align="center" eyebrow="Confianza" title={<span id="trust-title">Hecho con cuidado, de principio a fin.</span>} />
        <div className="mt-12 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
          {ITEMS.map(({ Icon, big, label }, i) => (
            <AnimatedSection key={big} delay={i * 80} className="bg-white px-5 py-9 text-center">
              <Icon size={26} strokeWidth={1.25} className="mx-auto text-terra" aria-hidden="true" />
              <p className="mt-4 font-display text-2xl md:text-3xl font-light text-ink">{big}</p>
              <p className="mt-1 text-sm text-stone">{label}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
