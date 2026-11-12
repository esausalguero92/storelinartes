import { permanentRedirect } from "next/navigation";

// El catálogo vive en /tienda. Se conserva esta ruta para enlaces antiguos.
export default function ProductosPage() {
  permanentRedirect("/tienda");
}
