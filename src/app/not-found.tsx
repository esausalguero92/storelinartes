import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-cream min-h-[70vh] flex items-center justify-center py-20">
      <div className="container-site text-center max-w-lg">
        <p className="eyebrow">Error 404</p>
        <h1 className="h-display mt-4">Esta página no existe</h1>
        <p className="mt-5 text-bark">La página que buscas no existe o fue movida. Te invitamos a explorar nuestros regalos personalizados.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">Volver al inicio</Link>
          <Link href="/tienda" className="btn-outline">Ver la tienda</Link>
        </div>
      </div>
    </div>
  );
}
