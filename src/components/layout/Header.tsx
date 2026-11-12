"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { buildWhatsAppUrl, cn } from "@/lib/utils";
import { NAV, SITE, WA_MESSAGES } from "@/config/site";
import Logo from "@/components/ui/Logo";
import { IconFacebook, IconInstagram } from "@/components/ui/Icons";

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const waUrl = buildWhatsAppUrl(SITE.whatsapp, WA_MESSAGES.personalizar);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/tienda" && pathname.startsWith("/productos")));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-shadow duration-300 border-b border-line",
          scrolled && "shadow-[0_6px_24px_-18px_rgba(58,52,43,0.45)]",
        )}
      >
        <div className="container-site grid grid-cols-[1fr_auto_1fr] items-center h-[72px] md:h-[84px]">
          {/* Izquierda: menú (desktop) / hamburguesa (móvil) */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Navegación principal">
            {NAV.map((item) =>
              item.children ? (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={cn("flex items-center gap-1 py-2 text-[12px] uppercase tracking-label transition-colors hover:text-terra", isActive(item.href) ? "text-terra" : "text-olive")}
                    aria-haspopup="true"
                  >
                    {item.label}
                    <ChevronDown size={14} className="transition-transform group-hover:rotate-180" aria-hidden="true" />
                  </Link>
                  <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 absolute left-0 top-full pt-3">
                    <ul className="min-w-[230px] bg-white border border-line shadow-card py-3">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block px-5 py-2 text-sm text-bark hover:bg-cream hover:text-olive transition-colors">
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("py-2 text-[12px] uppercase tracking-label transition-colors hover:text-terra", isActive(item.href) ? "text-terra" : "text-olive")}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <button
            className="lg:hidden -ml-2 p-2 text-olive justify-self-start"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            <Menu size={26} strokeWidth={1.5} />
          </button>

          {/* Centro: logo */}
          <Link href="/" aria-label={`${SITE.fullName} — Inicio`} className="justify-self-center">
            <Logo />
          </Link>

          {/* Derecha: redes + CTA */}
          <div className="flex items-center justify-end gap-4">
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram de Linartes" className="hidden md:block text-olive hover:text-terra transition-colors">
              <IconInstagram className="w-[18px] h-[18px]" />
            </a>
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook de Linartes" className="hidden md:block text-olive hover:text-terra transition-colors">
              <IconFacebook className="w-[18px] h-[18px]" />
            </a>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-primary !px-4 !py-2.5 md:!px-5 !text-[11px]">
              <span className="hidden sm:inline">Personalizar</span>
              <span className="sm:hidden">Cotizar</span>
            </a>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden transition-opacity duration-300", menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        aria-hidden={!menuOpen}
      >
        <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[86%] max-w-sm bg-cream flex flex-col transition-transform duration-300",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
        >
          <div className="flex items-center justify-between px-5 h-[72px] border-b border-line">
            <Logo />
            <button className="p-2 text-olive" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
              <X size={26} strokeWidth={1.5} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Menú móvil">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block py-3 font-display text-2xl font-light text-ink">
                    {item.label}
                  </Link>
                  {item.children && (
                    <ul className="mb-3 ml-1 border-l border-line pl-4 space-y-1">
                      {item.children.slice(1).map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block py-1.5 text-sm text-bark">{c.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-5 pb-8 space-y-4">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">Quiero personalizar</a>
            <div className="flex items-center justify-center gap-6 text-olive">
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IconInstagram /></a>
              <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IconFacebook /></a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
