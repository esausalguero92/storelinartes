import Link from "next/link";
import Image from "next/image";
import { cn, formatPrice, getDiscountPercent, isSvg } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export default function ProductCard({ product, className, priority }: ProductCardProps) {
  const discount = getDiscountPercent(product.price, product.priceOriginal);
  const img = product.images[0];

  return (
    <Link href={`/productos/${product.slug}`} className={cn("group flex flex-col", className)} aria-label={`Ver ${product.name}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          unoptimized={isSvg(img.src)}
          priority={priority}
        />
        {product.badge && product.inStock && (
          <span className="absolute left-3 top-3 bg-white/95 px-2.5 py-1 text-[10px] font-medium uppercase tracking-label text-olive">
            {product.badge}
          </span>
        )}
        {!product.inStock && (
          <span className="absolute left-3 top-3 bg-ink/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-label text-white">
            Agotado
          </span>
        )}
        {discount && (
          <span className="absolute right-3 top-3 bg-terra px-2.5 py-1 text-[10px] font-medium text-white">-{discount}%</span>
        )}
        <span className="absolute inset-x-3 bottom-3 translate-y-2 bg-olive py-2.5 text-center text-[11px] font-medium uppercase tracking-label text-mist opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Ver y personalizar
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <span className="text-[10px] font-medium uppercase tracking-label text-stone">{product.category}</span>
        <h3 className="mt-1.5 font-display text-lg font-light leading-snug text-ink">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-stone">{product.tagline}</p>
        <div className="mt-2 flex items-baseline gap-2 text-sm">
          {product.priceFrom && <span className="text-stone">Desde</span>}
          <span className="font-medium text-terra">{formatPrice(product.price, product.currency)}</span>
          {product.priceOriginal && discount && (
            <span className="text-stone line-through">{formatPrice(product.priceOriginal, product.currency)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
