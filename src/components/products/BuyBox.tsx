"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Minus, Plus, X, Lock } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { GT_DEPARTMENTS } from "@/lib/gt-departments";
import type { Product, PurchaseInfo } from "@/types";

/**
 * Botón "Comprar ahora" + formulario de envío en ventana emergente.
 * Se inserta dentro de la landing del producto sin cambiar su estructura.
 * El precio que se muestra aquí es solo informativo: el servidor lo recalcula.
 */

const PURPLE = "#404537"; // oliva
const CREAM = "#3A342B"; // texto principal
const CHAMPAGNE = "#CD7C50"; // terracota
const MUTED = "#5B5245";
const SUBTLE = "#7F7B76";
const SURFACE = "#FFFFFF";
const SURFACE2 = "#FAF5EC";
const BORDER = "#E4DED3";
const ON_DARK = "#F2F4E5";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

interface Props {
  product: Product;
  purchase: PurchaseInfo;
}

type ShippingType = "CIUDAD" | "INTERIOR";

export default function BuyBox({ product, purchase }: Props) {
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const max = Math.max(1, purchase.maxQty);

  return (
    <>
      <div className="flex items-stretch gap-3">
        <div
          className="flex items-center rounded-none overflow-hidden"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          role="group"
          aria-label="Cantidad"
        >
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="w-11 h-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ color: CREAM }}
            aria-label="Disminuir cantidad"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-semibold tabular-nums" style={{ color: CREAM }} aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            disabled={qty >= max}
            className="w-11 h-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ color: CREAM }}
            aria-label="Aumentar cantidad"
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 rounded-none",
            "font-semibold text-base transition-all duration-300",
            "hover:opacity-90 uppercase tracking-[0.18em] text-[12px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD7C50]",
          )}
          style={{ background: PURPLE, color: ON_DARK }}
          aria-haspopup="dialog"
        >
          <Lock size={16} aria-hidden="true" />
          Comprar ahora
        </button>
      </div>

      {open && <CheckoutDialog product={product} purchase={purchase} qty={qty} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── Ventana de checkout ─────────────────────────────────────────────────────

function CheckoutDialog({
  product,
  purchase,
  qty,
  onClose,
}: Props & { qty: number; onClose: () => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [shipping, setShipping] = useState<ShippingType>("CIUDAD");
  const [department, setDepartment] = useState<string>("Guatemala");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [badFields, setBadFields] = useState<string[]>([]);

  const shippingGTQ = shipping === "CIUDAD" ? purchase.shippingCityGTQ : purchase.shippingInteriorGTQ;
  const subtotal = product.price * qty;
  const total = subtotal + shippingGTQ;

  // Cerrar con Escape, bloquear scroll del fondo y enfocar el diálogo.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, submitting]);

  // Cloudflare Turnstile (anti-bots).
  useEffect(() => {
    if (!purchase.turnstileSiteKey) return;
    const renderWidget = () => {
      if (!turnstileRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: purchase.turnstileSiteKey,
        theme: "light",
        language: "es",
        callback: (t: string) => setToken(t),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    };
    if (window.turnstile) renderWidget();
    else {
      const id = "cf-turnstile-script";
      let s = document.getElementById(id) as HTMLScriptElement | null;
      if (!s) {
        s = document.createElement("script");
        s.id = id;
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener("load", renderWidget);
    }
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [purchase.turnstileSiteKey]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;
      setError("");
      setBadFields([]);
      if (purchase.turnstileSiteKey && !token) {
        setError("Completa la verificación de seguridad.");
        return;
      }
      const f = new FormData(e.currentTarget);
      const val = (k: string) => String(f.get(k) ?? "").trim();
      const payload = {
        items: [{ slug: product.slug, qty }],
        customer: { name: val("name"), email: val("email"), phone: val("phone") },
        shipping: {
          type: shipping,
          department,
          municipality: val("municipality"),
          address: val("address"),
          reference: val("reference") || undefined,
        },
        notes: val("notes") || undefined,
        turnstileToken: token || undefined,
      };

      setSubmitting(true);
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          checkoutUrl?: string;
          message?: string;
          fields?: string[];
        };
        if (res.ok && data.ok && data.checkoutUrl && data.checkoutUrl.startsWith("https://app.recurrente.com/")) {
          window.location.assign(data.checkoutUrl);
          return;
        }
        setError(data.message ?? "No pudimos procesar tu solicitud.");
        setBadFields(data.fields ?? []);
      } catch {
        setError("Sin conexión. Revisa tu internet e intenta de nuevo.");
      }
      setSubmitting(false);
      if (widgetId.current && window.turnstile) {
        window.turnstile.reset(widgetId.current);
        setToken("");
      }
    },
    [department, product.slug, purchase.turnstileSiteKey, qty, shipping, submitting, token],
  );

  const invalid = (field: string) => badFields.some((b) => b.endsWith(field));

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(58,52,43,0.55)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-none outline-none"
        style={{ background: SURFACE2, border: `1px solid ${BORDER}`, boxShadow: "0 30px 80px -30px rgba(58,52,43,0.45)" }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 id={titleId} className="text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 300, color: CREAM }}>
            Datos de envío
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ color: MUTED, border: `1px solid ${BORDER}` }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4" noValidate={false}>
          <Field label="Nombre completo" name="name" autoComplete="name" required minLength={3} maxLength={120} invalid={invalid("name")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Correo" name="email" type="email" autoComplete="email" required maxLength={160} invalid={invalid("email")} />
            <Field
              label="Teléfono"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              pattern="[0-9+\s\-]{8,16}"
              placeholder="5555 5555"
              maxLength={16}
              invalid={invalid("phone")}
            />
          </div>

          <fieldset>
            <legend className="text-xs font-medium mb-2" style={{ color: MUTED }}>Tipo de envío</legend>
            <div className="grid grid-cols-2 gap-3">
              {(["CIUDAD", "INTERIOR"] as const).map((t) => {
                const price = t === "CIUDAD" ? purchase.shippingCityGTQ : purchase.shippingInteriorGTQ;
                const active = shipping === t;
                return (
                  <label
                    key={t}
                    className="cursor-pointer rounded-none px-4 py-3 text-sm transition-all"
                    style={{
                      background: active ? ON_DARK : SURFACE,
                      border: `1px solid ${active ? PURPLE : BORDER}`,
                      color: CREAM,
                    }}
                  >
                    <input
                      type="radio"
                      name="shippingType"
                      value={t}
                      checked={active}
                      onChange={() => {
                        setShipping(t);
                        if (t === "CIUDAD") setDepartment("Guatemala");
                      }}
                      className="sr-only"
                    />
                    <span className="block font-medium">{t === "CIUDAD" ? "Ciudad capital" : "Interior"}</span>
                    <span className="block text-xs mt-0.5" style={{ color: MUTED }}>
                      {price > 0 ? formatCurrency(price) : "Envío incluido"}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium" style={{ color: MUTED }}>Departamento</span>
              <select
                name="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1.5 w-full rounded-none px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#404537]"
                style={{ background: SURFACE, border: `1px solid ${invalid("department") ? "#b45309" : BORDER}`, color: CREAM }}
                required
              >
                {GT_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <Field label="Municipio / zona" name="municipality" autoComplete="address-level2" required minLength={2} maxLength={80} invalid={invalid("municipality")} />
          </div>

          <Field label="Dirección" name="address" autoComplete="street-address" required minLength={5} maxLength={300} invalid={invalid("address")} />
          <Field label="Referencia (opcional)" name="reference" maxLength={200} invalid={invalid("reference")} />
          <Field label="Personalización: nombre, frase, fecha… (opcional)" name="notes" maxLength={500} textarea invalid={invalid("notes")} />

          {/* Resumen */}
          <div className="rounded-none p-4 text-sm space-y-1.5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <Row label={`${qty} × ${product.name}`} value={formatCurrency(subtotal)} />
            <Row label="Envío" value={shippingGTQ > 0 ? formatCurrency(shippingGTQ) : "Incluido"} />
            <div className="pt-2 mt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <Row label="Total" value={formatCurrency(total)} strong />
            </div>
          </div>

          {purchase.turnstileSiteKey && <div ref={turnstileRef} className="min-h-[65px]" />}

          {error && (
            <p role="alert" className="text-sm rounded-none px-4 py-3" style={{ background: "rgba(205,124,80,0.10)", color: "#9A4A22", border: "1px solid rgba(205,124,80,0.35)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-none font-semibold transition-all duration-300 disabled:opacity-60"
            style={{ background: PURPLE, color: ON_DARK }}
          >
            <Lock size={16} aria-hidden="true" />
            {submitting ? "Conectando con el pago seguro…" : `Pagar ${formatCurrency(total)}`}
          </button>
          <p className="text-[11px] text-center leading-relaxed" style={{ color: SUBTLE }}>
            Serás redirigido a <span style={{ color: CHAMPAGNE }}>Recurrente</span> para pagar con tarjeta de forma segura.
            Linartes nunca ve ni guarda los datos de tu tarjeta.
          </p>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span style={{ color: strong ? CREAM : MUTED }} className={strong ? "font-semibold" : ""}>{label}</span>
      <span style={{ color: strong ? CHAMPAGNE : CREAM }} className={cn("tabular-nums", strong && "font-bold")}>{value}</span>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  invalid?: boolean;
  textarea?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

function Field({ label, name, invalid, textarea, ...rest }: FieldProps) {
  const style = { background: SURFACE, border: `1px solid ${invalid ? "#b45309" : BORDER}`, color: CREAM };
  const cls = "mt-1.5 w-full rounded-none px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#404537] placeholder:text-[#8A847C]";
  return (
    <label className="block">
      <span className="text-xs font-medium" style={{ color: MUTED }}>{label}</span>
      {textarea ? (
        <textarea name={name} rows={3} maxLength={rest.maxLength} className={cls} style={style} aria-invalid={invalid || undefined} />
      ) : (
        <input name={name} className={cls} style={style} aria-invalid={invalid || undefined} {...rest} />
      )}
    </label>
  );
}
