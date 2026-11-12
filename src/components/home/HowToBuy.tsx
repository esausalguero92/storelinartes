import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";

const STEPS = [
  { title: "Elige", body: "Encuentra el regalo que quieres personalizar." },
  { title: "Personaliza", body: "Cuéntanos qué nombre, frase, logo o diseño deseas." },
  { title: "Confirmamos", body: "Te enviamos los detalles de tu pedido para confirmar antes de producir." },
  { title: "Recibe", body: "Preparamos tu pedido y coordinamos la entrega." },
];

export default function HowToBuy() {
  return (
    <section id="como-comprar" className="section-y bg-cream scroll-mt-24" aria-labelledby="htb-title">
      <div className="container-site">
        <SectionHeading align="center" eyebrow="Cómo comprar" title={<span id="htb-title">Comprar tu regalo es fácil.</span>} />
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {STEPS.map((s, i) => (
            <AnimatedSection as="li" key={s.title} delay={i * 90} className="relative text-center lg:px-8">
              {i < STEPS.length - 1 && <span className="absolute left-1/2 top-7 hidden h-px w-full bg-line lg:block" aria-hidden="true" />}
              <span className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-olive bg-cream font-display text-xl font-light text-olive">
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-2xl font-light text-ink">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-[240px] text-sm leading-relaxed text-stone">{s.body}</p>
            </AnimatedSection>
          ))}
        </ol>
        <p className="mt-14 text-center text-[12px] font-medium uppercase tracking-label text-olive">
          Enviamos a toda Guatemala <span aria-hidden="true">🇬🇹</span>
        </p>
      </div>
    </section>
  );
}
