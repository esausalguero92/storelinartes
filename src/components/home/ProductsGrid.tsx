import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Product } from "@/types";

export default function ProductsGrid({ products }: { products: Product[] }) {
  return (
    <section id="favoritos" className="section-y bg-cream scroll-mt-24" aria-labelledby="fav-title">
      <div className="container-site">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Productos destacados"
            title={<span id="fav-title">Los favoritos de Linartes</span>}
            intro="Regalos personalizados que han sido elegidos para celebrar momentos importantes."
          />
          <Link href="/tienda" className="link-underline self-start md:self-auto">Ver toda la tienda</Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
          {products.map((p, i) => (
            <AnimatedSection key={p.id} delay={i * 90}>
              <ProductCard product={p} className="h-full" />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
