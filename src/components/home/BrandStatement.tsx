import AnimatedSection from "@/components/ui/AnimatedSection";

const values = [
  {
    title: "Regalos con Personalidad",
    description: "Cada producto esta seleccionado para destacar. No vendemos objetos, vendemos experiencias y momentos memorables.",
  },
  {
    title: "Calidad que se Siente",
    description: "Materiales premium, acabados cuidados y una presentacion que ya es parte del regalo. Los detalles marcan la diferencia.",
  },
  {
    title: "Entrega Rapida en Guatemala",
    description: "Enviamos a todo el pais. Capital en 1-2 dias, interior en 2-4 dias habiles. Tu regalo llega a tiempo, siempre.",
  },
];

const howToBuy = [
  { step: "01", title: "Elige tu producto",       desc: "Explora y encuentra tu hallazgo." },
  { step: "02", title: "Escribenos por WhatsApp", desc: "Confirmamos disponibilidad y coordinamos tu pedido." },
  { step: "03", title: "Recibe por delivery",     desc: "Envios rapidos a tu puerta en todo Guatemala." },
];

const PURPLE      = "#56327A";
const PURPLE_DARK = "#3D2157";
const PURPLE_LGT  = "#9B6ECC";
const CREAM       = "#F4F0EA";
const MUTED       = "#B8B2AA";
const BG_VALUES   = "#0E0B18";
const BG_HOWTO    = "#06090F";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-semibold mt-2 mb-3"
      style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.2rem, 4.5vw, 2.4rem)", color: CREAM }}
    >
      {children}
    </h2>
  );
}

export default function BrandStatement() {
  return (
    <>
      {/* Valores */}
      <section className="section-padding relative overflow-hidden" style={{ background: BG_VALUES }} aria-labelledby="values-heading">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${PURPLE}, transparent 70%)` }} aria-hidden="true" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-[0.05] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${PURPLE_DARK}, transparent 70%)` }} aria-hidden="true" />

        <div className="container-site relative z-10">
          <AnimatedSection className="text-center mb-10">
            <SectionTitle>Mas que un regalo</SectionTitle>
            <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: MUTED }}>
              Seleccionamos cada producto pensando en el momento en que se abre, en la cara del que lo recibe.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {values.map((v, i) => (
              <AnimatedSection key={v.title} delay={i * 120}
                className="group p-5 cursor-default transition-all duration-500 hover:bg-[rgba(11,11,13,0.7)]"
                style={{ background: "rgba(11,11,13,0.5)", border: "1px solid rgba(244,240,234,0.08)", borderRadius: "1.25rem", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
                <div className="w-6 h-px mb-4 transition-all duration-300 group-hover:w-10"
                  style={{ background: `linear-gradient(90deg, ${PURPLE}, ${PURPLE_LGT})` }} />
                <h3 className="font-semibold text-sm mb-2" style={{ color: CREAM }}>{v.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{v.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Como comprar */}
      <section className="section-padding" style={{ background: BG_HOWTO }} aria-labelledby="how-to-buy-heading">
        <div className="container-site">
          <AnimatedSection className="text-center mb-10">
            <SectionTitle>Como comprar</SectionTitle>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howToBuy.map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 120} className="text-center">
                <div className="text-3xl font-semibold mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(147,112,219,0.45)" }}>
                  {item.step}
                </div>
                <div className="w-8 h-px mx-auto mb-4"
                  style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }} />
                <h3 className="font-semibold text-sm mb-1" style={{ color: CREAM }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{item.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="section-padding relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #0A061A 0%, ${PURPLE_DARK} 55%, ${PURPLE} 100%)` }}
        aria-labelledby="cta-heading">
        <div className="gold-line absolute top-0 inset-x-0" aria-hidden="true" />
        <div className="gold-line absolute bottom-0 inset-x-0" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] h-[300px] rounded-full opacity-[0.12] pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${PURPLE}, transparent 70%)` }} aria-hidden="true" />

        <div className="container-site text-center relative z-10">
          <AnimatedSection>
            <h2 id="cta-heading" className="font-semibold mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.2rem, 5.5vw, 3rem)", color: CREAM, lineHeight: 1.1 }}>
              El regalo perfecto<br />te esta esperando
            </h2>
            <p className="text-sm md:text-base max-w-xl mx-auto leading-relaxed" style={{ color: MUTED }}>
              Explora nuestros productos y encuentra ese detalle especial que va a dejar huella. Envios rapidos a todo Guatemala.
            </p>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
