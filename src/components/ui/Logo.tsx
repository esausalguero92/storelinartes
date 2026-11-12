import { cn } from "@/lib/utils";

/**
 * Logotipo tipográfico temporal. Cuando Linartes entregue su logo, reemplazar
 * por <Image src="/images/linartes/logo.svg" … /> manteniendo esta misma API.
 */
export default function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={cn("inline-flex flex-col items-center leading-none select-none", className)}>
      <span
        className={cn("font-display font-light tracking-[0.02em]", tone === "dark" ? "text-olive" : "text-mist")}
        style={{ fontSize: "1.9rem" }}
      >
        Linartes
      </span>
      <span
        className={cn("mt-1 text-[9px] font-medium uppercase tracking-[0.55em] pl-[0.55em]", tone === "dark" ? "text-terra" : "text-sage-light")}
      >
        Design
      </span>
    </span>
  );
}
