import type { Metadata, Viewport } from "next";
import "./globals.css";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { SITE } from "@/config/site";

// Dinámico en todas las páginas: necesario para el nonce de la CSP (ver src/middleware.ts).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Regalos personalizados en Guatemala`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "regalos personalizados guatemala",
    "regalos corporativos guatemala",
    "regalos de graduacion guatemala",
    "kit damas de honor guatemala",
    "sets de regalo personalizados",
    "linartes",
    "linartes design",
  ],
  authors: [{ name: SITE.fullName }],
  creator: SITE.fullName,
  publisher: SITE.fullName,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "es_GT",
    url: SITE.url,
    siteName: SITE.fullName,
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${SITE.fullName} — Regalos personalizados` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | Regalos personalizados`,
    description: SITE.tagline,
    images: ["/og-image.png"],
  },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#404537",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="scroll-smooth">
      {/*
        IMPORTANTE: body NO tiene flex — en iOS Safari y Chrome Android,
        body con display:flex hace que position:fixed hijos no se anclen
        al viewport correctamente. El flex se mueve a un div interno.
      */}
      <body className="bg-white text-bark antialiased">
        <div className="flex flex-col min-h-screen">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-olive focus:text-mist text-sm"
          >
            Ir al contenido principal
          </a>
          <AnnouncementBar />
          <Header />
          <main id="main-content" className="flex-grow" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>

        {/* Elementos fixed fuera del flex — siempre anclados al viewport */}
        <WhatsAppButton />
      </body>
    </html>
  );
}
