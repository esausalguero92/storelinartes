import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
  as?: "h1" | "h2";
}

export default function SectionHeading({ eyebrow, title, intro, align = "left", tone = "dark", className, as: H = "h2" }: Props) {
  return (
    <div className={cn(align === "center" && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow && <span className={cn("eyebrow", tone === "light" && "!text-sage-light")}>{eyebrow}</span>}
      <H className={cn("h-section mt-3", tone === "light" && "!text-mist")}>{title}</H>
      {intro && <p className={cn("mt-4 text-base leading-relaxed", tone === "light" ? "text-mist/80" : "text-stone")}>{intro}</p>}
    </div>
  );
}
