"use client";

import { useState } from "react";
import { buildWhatsAppUrl } from "@/lib/utils";
import { SITE } from "@/config/site";
import { IconWhatsApp } from "@/components/ui/Icons";

/**
 * Cotizador corporativo: arma un mensaje y abre WhatsApp.
 * No envía datos a ningún servidor — todo ocurre en el navegador del cliente.
 */
export default function QuoteForm({ productNames }: { productNames: string[] }) {
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
    if (!v("empresa") || !v("nombre") || !v("cantidad")) {
      setError("Completa empresa, nombre y cantidad aproximada.");
      return;
    }
    setError("");
    const lines = [
      "¡Hola Linartes! Quiero cotizar regalos corporativos.",
      "",
      `• Empresa: ${v("empresa")}`,
      `• Contacto: ${v("nombre")}`,
      `• Cantidad aproximada: ${v("cantidad")}`,
      v("fecha") && `• Fecha requerida: ${v("fecha")}`,
      v("producto") && `• Producto de interés: ${v("producto")}`,
      `• ¿Tenemos logo listo?: ${v("logo") || "No indicado"}`,
      v("detalles") && `• Detalles: ${v("detalles")}`,
    ].filter(Boolean);
    window.open(buildWhatsAppUrl(SITE.whatsapp, lines.join("\n")), "_blank", "noopener,noreferrer");
  }

  const input = "mt-1.5 w-full border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-olive";
  const label = "block text-[11px] font-medium uppercase tracking-label text-stone";

  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
      <label className="block">
        <span className={label}>Empresa *</span>
        <input name="empresa" required maxLength={120} autoComplete="organization" className={input} />
      </label>
      <label className="block">
        <span className={label}>Tu nombre *</span>
        <input name="nombre" required maxLength={120} autoComplete="name" className={input} />
      </label>
      <label className="block">
        <span className={label}>Cantidad aproximada *</span>
        <input name="cantidad" required maxLength={40} inputMode="numeric" placeholder="Ej. 50" className={input} />
      </label>
      <label className="block">
        <span className={label}>Fecha en que lo necesitas</span>
        <input name="fecha" type="date" className={input} />
      </label>
      <label className="block">
        <span className={label}>Producto de interés</span>
        <select name="producto" className={input} defaultValue="">
          <option value="">Aún no lo sé</option>
          {productNames.map((n) => <option key={n} value={n}>{n}</option>)}
          <option value="Otro / idea propia">Otro / idea propia</option>
        </select>
      </label>
      <label className="block">
        <span className={label}>¿Tienen logo listo?</span>
        <select name="logo" className={input} defaultValue="">
          <option value="">Seleccionar</option>
          <option value="Sí">Sí</option>
          <option value="No, necesitamos ayuda">No, necesitamos ayuda</option>
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Detalles</span>
        <textarea name="detalles" rows={3} maxLength={300} placeholder="Ocasión, presupuesto por persona, colores de marca…" className={input} />
      </label>
      {error && <p role="alert" className="sm:col-span-2 text-sm text-terra-dark">{error}</p>}
      <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-stone">Al enviar se abrirá WhatsApp con tu solicitud lista.</p>
        <button type="submit" className="btn-primary">
          <IconWhatsApp className="h-4 w-4" /> Solicitar cotización
        </button>
      </div>
    </form>
  );
}
