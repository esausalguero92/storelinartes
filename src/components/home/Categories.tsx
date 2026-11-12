import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/config/site";
import { cn } from "@/lib/utils";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";

const TONES = [
  "bg-cream text-ink",
  "bg-olive text-mist",
  "bg-mist text-ink",
  "bg-[#EDE5D6] text-ink",
  "bg-[#E7E8DA] text-ink",
];

export default function Categories() {
  return (
    <section id="categorias" className="section-y bg-white scroll-mt-24" aria-labelledby="cat-title">
      <div className="container-site">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading eyebrow="Categorías" title={<span id="cat-title">Encuentra el regalo perfecto</span>} />
          <Link href="/tienda" className="link-underline self-start md:self-auto">Ver todas las categorías</Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
          {CATEGORIES.map((c, i) => (
            <AnimatedSection key={c.slug} delay={i * 70} className={cn(i === 4 && "col-span-2 lg:col-span-1")}>
              <Link
                href={`/tienda?categoria=${c.slug}`}
                className={cn("group flex h-full min-h-[190px] md:min-h-[240px] flex-col justify-between p-5 md:p-6 transition-transform duration-300 hover:-translate-y-1", TONES[i % TONES.length])}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-medium tracking-label opacity-70">0{i + 1}</span>
                  <ArrowUpRight size={18} strokeWidth={1.5} className="opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className={cn("font-display text-xl md:text-2xl font-light leading-tight", i === 1 ? "text-mist" : "text-ink")}>{c.title}</h3>
                  <p className={cn("mt-2 text-[13px] leading-snug", i === 1 ? "text-mist/80" : "text-stone")}>{c.blurb}</p>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
