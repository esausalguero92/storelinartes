import type { Metadata } from "next";
import Link from "next/link";
import { getOrderByPublicId } from "@/server/db/repositories";
import { isCheckoutReady } from "@/server/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estado de tu pedido",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type View = { title: string; body: string; tone: "ok" | "wait" | "cancel" };

async function resolveView(estado?: string, ref?: string): Promise<View> {
  if (estado === "cancelado") {
    return { tone: "cancel", title: "Pago cancelado", body: "No se realizó ningún cobro. Puedes volver al producto e intentarlo de nuevo cuando quieras." };
  }
  if (ref && UUID.test(ref) && isCheckoutReady()) {
    try {
      const order = await getOrderByPublicId(ref);
      if (order && (order.status === "PAID" || order.status === "REVIEW")) {
        const first = order.customer_name.split(" ")[0];
        return {
          tone: "ok",
          title: `¡Gracias, ${first}!`,
          body: `Tu pago fue confirmado. Pedido LW-${String(order.id).padStart(5, "0")}. Te enviamos la confirmación por correo y te contactaremos para coordinar la entrega.`,
        };
      }
    } catch {
      /* si la BD no responde, mostramos el mensaje de espera */
    }
  }
  return {
    tone: "wait",
    title: "Estamos confirmando tu pago",
    body: "Si completaste el pago, lo estamos confirmando. En unos minutos te llegará un correo de confirmación. Si no te llega, escríbenos por WhatsApp.",
  };
}

export default async function PedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; ref?: string }>;
}) {
  const { estado, ref } = await searchParams;
  const view = await resolveView(estado, ref);
  const accent = view.tone === "cancel" ? "text-stone" : "text-terra";

  return (
    <div className="bg-cream min-h-[70vh] flex items-center justify-center py-20">
      <div className="container-site text-center max-w-lg">
        <p className={`${accent} text-[11px] tracking-label uppercase font-medium mb-4`}>
          {view.tone === "ok" ? "Pedido confirmado" : view.tone === "wait" ? "Procesando" : "Sin cobro"}
        </p>
        <h1 className="h-section mb-5">{view.title}</h1>
        <p className="text-bark mb-10 leading-relaxed">{view.body}</p>
        <Link href="/tienda" className="btn-primary">Seguir explorando</Link>
      </div>
    </div>
  );
}
