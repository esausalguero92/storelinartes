import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/data/products";
import ProductLanding from "@/components/products/ProductLanding";
import { getPurchaseInfo } from "@/server/services/purchase-info";

// Renderizado dinámico — precios leídos en cada request desde env vars
export const dynamic = "force-dynamic";

// ─── Metadata per product ─────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.seo.title,
    description: product.seo.description,
    keywords: product.seo.keywords,
    alternates: {
      canonical: `/productos/${product.slug}`,
    },
    openGraph: {
      title: product.seo.title,
      description: product.seo.description,
      type: "website",
      images: product.images[0]
        ? [{ url: product.images[0].src, alt: product.images[0].alt }]
        : undefined,
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const purchase = await getPurchaseInfo(product.slug);
  const others = getProducts().filter((p) => p.slug !== product.slug);
  const related = [
    ...others.filter((p) => p.categories.some((c) => product.categories.includes(c))),
    ...others.filter((p) => !p.categories.some((c) => product.categories.includes(c))),
  ].slice(0, 4);

  return <ProductLanding product={product} purchase={purchase} related={related} />;
}
