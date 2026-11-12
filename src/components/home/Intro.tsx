import AnimatedSection from "@/components/ui/AnimatedSection";

export default function Intro() {
  return (
    <section className="bg-white pt-16 md:pt-24 xl:pt-28 pb-2" aria-labelledby="intro-title">
      <AnimatedSection className="container-site max-w-3xl text-center">
        <span className="eyebrow">Linartes Design</span>
        <h2 id="intro-title" className="h-section mt-4">Diseñado para regalar. Creado para recordar.</h2>
        <div className="mt-7 space-y-4 text-base md:text-lg leading-relaxed text-bark">
          <p>
            En Linartes creemos que los mejores regalos son aquellos que tienen algo de quien los entrega y algo de quien los recibe.
          </p>
          <p>
            Por eso cuidamos cada parte del proceso: desde la elección del producto y su personalización hasta el diseño y la presentación.
          </p>
        </div>
        <p className="mt-8 font-display text-xl md:text-2xl font-light italic text-olive">
          Porque los detalles también cuentan historias.
        </p>
      </AnimatedSection>
    </section>
  );
}
