import type { Metadata } from "next";
import { buildWhatsAppUrl } from "@/lib/utils";
import { SITE, WA_MESSAGES } from "@/config/site";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { IconFacebook, IconInstagram, IconTikTok, IconWhatsApp } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp o síguenos en redes sociales. Regalos personalizados con envíos a toda Guatemala.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  const channels = [
    { name: "WhatsApp", detail: "La forma más rápida de cotizar y personalizar", href: buildWhatsAppUrl(SITE.whatsapp, WA_MESSAGES.general), Icon: IconWhatsApp, cta: "Escribir ahora" },
    { name: "Instagram", detail: "@linartes_design", href: SITE.instagram, Icon: IconInstagram, cta: "Ver perfil" },
    { name: "Facebook", detail: "Linartes Design", href: SITE.facebook, Icon: IconFacebook, cta: "Ver página" },
    ...(SITE.tiktok ? [{ name: "TikTok", detail: "Síguenos", href: SITE.tiktok, Icon: IconTikTok, cta: "Ver perfil" }] : []),
  ];

  return (
    <div className="bg-white">
      <section className="bg-cream">
        <div className="container-site py-16 md:py-24 text-center">
          <span className="eyebrow">Contacto</span>
          <h1 className="h-display mt-5 mx-auto max-w-3xl">Hablemos de tu próximo regalo.</h1>
          <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-bark">
            Cuéntanos para quién es, la ocasión y cómo te gustaría personalizarlo. Te respondemos con ideas y una cotización.
          </p>
        </div>
      </section>

      <section className="section-y">
        <div className="container-site grid gap-4 md:grid-cols-3">
          {channels.map(({ name, detail, href, Icon, cta }, i) => (
            <AnimatedSection key={name} delay={i * 80}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex h-full flex-col justify-between border p-8 transition-colors ${i === 0 ? "border-olive bg-olive text-mist hover:bg-olive-dark" : "border-line bg-white hover:border-olive"}`}
              >
                <div>
                  <Icon className={`h-8 w-8 ${i === 0 ? "text-mist" : "text-terra"}`} />
                  <h2 className={`mt-6 font-display text-2xl font-light ${i === 0 ? "!text-mist" : "text-ink"}`}>{name}</h2>
                  <p className={`mt-2 text-sm ${i === 0 ? "text-mist/80" : "text-stone"}`}>{detail}</p>
                </div>
                <span className={`mt-8 text-[12px] font-medium uppercase tracking-label ${i === 0 ? "text-mist" : "text-olive"}`}>
                  {cta} →
                </span>
              </a>
            </AnimatedSection>
          ))}
        </div>
        <p className="container-site mt-12 text-center text-[12px] font-medium uppercase tracking-label text-olive">
          Enviamos a toda Guatemala <span aria-hidden="true">🇬🇹</span>
        </p>
      </section>
    </div>
  );
}
