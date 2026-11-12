"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  as?: React.ElementType;
}

export default function AnimatedSection({
  children,
  className,
  style,
  delay = 0,
  as: Tag = "div",
}: AnimatedSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const El = Tag as any;

  const mergedStyle: React.CSSProperties = { transitionDelay: `${delay}ms`, ...style };

  return (
    <El
      ref={ref}
      className={cn("reveal", className)}
      style={mergedStyle}
    >
      {children}
    </El>
  );
}
