import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Intro from "@/components/home/Intro";
import Categories from "@/components/home/Categories";
import ProductsGrid from "@/components/home/ProductsGrid";
import MoreThanGift from "@/components/home/MoreThanGift";
import PersonalizeBand from "@/components/home/PersonalizeBand";
import CorporateSplit from "@/components/home/CorporateSplit";
import HowToBuy from "@/components/home/HowToBuy";
import Trust from "@/components/home/Trust";
import Testimonials from "@/components/home/Testimonials";
import FinalCTA from "@/components/home/FinalCTA";
import { getFeaturedProducts } from "@/data/products";
import { SITE } from "@/config/site";

// Renderizado dinámico — precios leídos en cada request desde env vars
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} | Regalos personalizados que sí se sienten especiales` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <Categories />
      <ProductsGrid products={getFeaturedProducts()} />
      <MoreThanGift />
      <PersonalizeBand />
      <CorporateSplit />
      <HowToBuy />
      <Trust />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
