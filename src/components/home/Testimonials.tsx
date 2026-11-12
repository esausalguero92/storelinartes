import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";

// Testimonios proporcionados por Linartes.
const QUOTES = [
  "Quedó precioso y la persona que lo recibió quedó encantada. La presentación hizo toda la diferencia.",
  "Me encantó porque pude personalizarlo exactamente como lo quería.",
  "La calidad superó mis expectativas. Definitivamente volvería a comprar.",
];

export default function Testimonials() {
  return (
    <section id="testimonios" className="section-y bg-mist scroll-mt-24" aria-labelledby="test-title">
      <div className="container-site">
        <SectionHeading align="center" eyebrow="Testimonios" title={<span id="test-title">Lo que dicen quienes han regalado con Linartes</span>} />
        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
          {QUOTES.map((q, i) => (
            <AnimatedSection as="figure" key={i} delay={i * 90} className="flex flex-col bg-white p-8 md:p-10">
              <span className="font-display text-5xl leading-none text-terra" aria-hidden="true">“</span>
              <blockquote className="mt-2 flex-1 font-display text-lg md:text-xl font-light leading-snug text-ink">{q}</blockquote>
              <figcaption className="mt-6 text-[11px] font-medium uppercase tracking-label text-stone">Cliente Linartes</figcaption>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
