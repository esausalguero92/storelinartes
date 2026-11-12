import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/utils";
import { CATEGORIES, SITE, WA_MESSAGES } from "@/config/site";
import Logo from "@/components/ui/Logo";
import { IconFacebook, IconInstagram, IconTikTok, IconWhatsApp } from "@/components/ui/Icons";

const columns = [
  {
    title: "Inicio",
    links: [
      { label: "Categorías", href: "/#categorias" },
      { label: "Productos destacados", href: "/#favoritos" },
      { label: "Personalización", href: "/#personalizacion" },
      { label: "Cómo comprar", href: "/#como-comprar" },
      { label: "Testimonios", href: "/#testimonios" },
    ],
  },
  {
    title: "Tienda",
    links: [
      { label: "Todos los productos", href: "/tienda" },
      ...CATEGORIES.map((c) => ({ label: c.name, href: `/tienda?categoria=${c.slug}` })),
    ],
  },
  {
    title: "Corporativo",
    links: [
      { label: "Soluciones empresariales", href: "/corporativo#soluciones" },
      { label: "Productos", href: "/corporativo#productos" },
      { label: "Pedidos por volumen", href: "/corporativo#volumen" },
      { label: "Cotización", href: "/corporativo#cotizacion" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const wa = buildWhatsAppUrl(SITE.whatsapp, WA_MESSAGES.general);
  const socials = [
    { name: "Instagram", href: SITE.instagram, Icon: IconInstagram },
    { name: "Facebook", href: SITE.facebook, Icon: IconFacebook },
    ...(SITE.tiktok ? [{ name: "TikTok", href: SITE.tiktok, Icon: IconTikTok }] : []),
  ];

  return (
    <footer className="bg-olive text-mist" role="contentinfo">
      <div className="container-site pt-16 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo tone="light" className="!items-start" />
            <p className="mt-6 text-sm leading-relaxed text-mist/80">
              Regalos personalizados para personas y empresas. Personalización, diseño y presentación premium.
            </p>
            <p className="mt-2 text-sm text-mist/80">Enviamos a toda Guatemala.</p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} de Linartes`}
                  className="flex h-10 w-10 items-center justify-center border border-mist/30 text-mist transition-colors hover:bg-mist hover:text-olive"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-[11px] font-medium uppercase tracking-label text-sage-light">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-sm text-mist/85 transition-colors hover:text-white">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="text-[11px] font-medium uppercase tracking-label text-sage-light">Contacto</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-mist/85 hover:text-white">
                    <IconWhatsApp className="h-4 w-4" /> WhatsApp
                  </a>
                </li>
                <li><a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="text-mist/85 hover:text-white">Instagram</a></li>
                <li><a href={SITE.facebook} target="_blank" rel="noopener noreferrer" className="text-mist/85 hover:text-white">Facebook</a></li>
                {SITE.email && <li><a href={`mailto:${SITE.email}`} className="text-mist/85 hover:text-white break-all">{SITE.email}</a></li>}
                <li><Link href="/contacto" className="text-mist/85 hover:text-white">Página de contacto</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-mist/15 pt-6 text-xs text-mist/60 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} {SITE.fullName}. Todos los derechos reservados.</p>
          <p>Hecho con cuidado, de principio a fin.</p>
        </div>
      </div>
    </footer>
  );
}
