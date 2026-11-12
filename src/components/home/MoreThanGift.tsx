import AnimatedSection from "@/components/ui/AnimatedSection";

const VALUES = [
  { title: "Personalización con intención", body: "Cada regalo puede llevar nombres, frases, fechas, logotipos o diseños creados especialmente para la ocasión." },
  { title: "Diseño que se nota", body: "No se trata solamente de personalizar. Cuidamos la composición, los materiales y los acabados para que el resultado se vea elegante." },
  { title: "Listo para regalar", body: "Nos encargamos de que cada detalle llegue presentado de una manera especial, porque la experiencia comienza desde que se entrega." },
  { title: "Para momentos que importan", body: "Graduaciones, bodas, cumpleaños, agradecimientos, reconocimientos, regalos corporativos y mucho más." },
];

export default function MoreThanGift() {
  return (
    <section className="section-y bg-white" aria-labelledby="mtg-title">
      <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <AnimatedSection className="lg:sticky lg:top-32 self-start">
          <span className="eyebrow">Nuestra forma de regalar</span>
          <h2 id="mtg-title" className="h-section mt-4">Más que un regalo. Un detalle pensado para esa persona.</h2>
          <p className="mt-6 text-base md:text-lg leading-relaxed text-bark">
            Cada pieza que creamos combina <strong className="font-medium text-ink">personalización, diseño y una presentación cuidada</strong> para
            convertir un producto en un recuerdo especial.
          </p>
        </AnimatedSection>
        <div className="grid gap-px bg-line sm:grid-cols-2 border border-line">
          {VALUES.map((v, i) => (
            <AnimatedSection key={v.title} delay={i * 80} className="bg-white p-7 md:p-9">
              <span className="font-display text-3xl font-light text-terra">0{i + 1}</span>
              <h3 className="mt-4 font-display text-xl font-light text-ink">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone">{v.body}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
