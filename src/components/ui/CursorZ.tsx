"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor personalizado — triángulo sin base (Λ) ligeramente inclinado.
 * Solo se monta en dispositivos con puntero preciso (mouse/trackpad).
 * El cursor nativo se oculta globalmente vía globals.css (@media pointer: fine).
 */
export default function CursorZ() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    setMounted(true);

    const onMove = (e: MouseEvent) => {
      const el = cursorRef.current;
      if (!el) return;
      el.style.left    = `${e.clientX - 13}px`;
      el.style.top     = `${e.clientY - 2}px`;
      el.style.opacity = "1";
    };

    const onLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "0";
    };

    const onEnter = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      style={{
        position:      "fixed",
        top:           0,
        left:          0,
        pointerEvents: "none",
        zIndex:        99999,
        opacity:       0,
        transition:    "opacity 0.25s ease",
      }}
    >
      {/* Triángulo sin base — dos trazos que se unen en el vértice superior, inclinado */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: "rotate(-22deg)", transformOrigin: "13px 2px", display: "block" }}
      >
        <filter id="cursor-glow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <g filter="url(#cursor-glow)">
          {/* trazo izquierdo: vértice superior → base izquierda */}
          <line x1="13" y1="2" x2="2"  y2="24" stroke="#F4F0EA" strokeWidth="2.2" strokeLinecap="round" />
          {/* trazo derecho: vértice superior → base derecha */}
          <line x1="13" y1="2" x2="24" y2="24" stroke="#F4F0EA" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
