import type { Product } from "@/types";
import type { CategorySlug } from "@/config/site";
import { getRuntimePrice } from "@/config/prices";

// ─── Catálogo Linartes ────────────────────────────────────────────────────────
// PENDIENTE (equipo Linartes): reemplazar fotos temporales (/images/linartes/*.svg),
// confirmar precios, contenido de cada set y tiempos de producción.
// Para agregar un producto: copia un bloque, cambia el slug y agrega su fila de
// stock en Supabase (o con el bot: /stock <slug> <cantidad>).

const DELIVERY = "Envíos a toda Guatemala";

export const products: Product[] = [
  {
    id: "001",
    slug: "set-regalo-premium",
    name: "Set de Regalo Premium",
    tagline: "Un detalle completo, personalizado y listo para sorprender.",
    description:
      "Una caja de regalo armada y personalizada para la persona que la recibe, con una presentación cuidada de principio a fin.",
    longDescription: `El Set de Regalo Premium reúne varios detalles en una sola presentación, pensada para que el momento de abrirlo sea parte del regalo.

Cada set se personaliza con el nombre, una frase o una fecha especial, y se arma cuidando la composición, los materiales y los acabados para que el resultado se vea elegante.

Es ideal para cumpleaños, aniversarios, agradecimientos o cualquier ocasión en la que quieras regalar algo más que un producto. Cuéntanos para quién es y te ayudamos a armarlo.`,
    price: 350,
    priceFrom: true,
    currency: "GTQ",
    images: [
      { src: "/images/linartes/set-regalo-premium.svg", alt: "Set de Regalo Premium personalizado — foto temporal" },
    ],
    features: [
      { icon: "", label: "Personalización con intención", description: "Nombre, frase o fecha especial para esa persona." },
      { icon: "", label: "Presentación premium",          description: "Llega armado y listo para regalar." },
      { icon: "", label: "Diseño que se nota",            description: "Cuidamos composición, materiales y acabados." },
      { icon: "", label: "Para cualquier ocasión",        description: "Cumpleaños, aniversarios, agradecimientos y más." },
    ],
    personalization: ["Nombre", "Frase", "Fecha"],
    includes: [
      "Selección de artículos según la ocasión (se confirma al cotizar)",
      "Personalización con nombre, frase o fecha",
      "Caja de presentación lista para regalar",
    ],
    specs: [
      { name: "Personalización", value: "Nombres, iniciales, fechas o frases" },
      { name: "Presentación",    value: "Caja de regalo" },
      { name: "Producción",      value: "Se confirma al aprobar el diseño" },
      { name: "Entrega",         value: DELIVERY },
    ],
    badge: "FAVORITO",
    badgeType: "gold",
    category: "Sets personalizados",
    categories: ["sets", "regalos-especiales"] satisfies CategorySlug[],
    tags: ["set de regalo", "regalo personalizado", "caja de regalo", "premium"],
    whatsappMessage: "¡Hola Linartes! Me interesa el Set de Regalo Premium. Quiero personalizarlo.",
    inStock: true,
    featured: true,
    seo: {
      title: "Set de Regalo Premium personalizado",
      description: "Set de regalo personalizado con presentación premium, listo para sorprender. Envíos a toda Guatemala.",
      keywords: ["set de regalo personalizado guatemala", "caja de regalo premium", "regalo personalizado guatemala"],
    },
  },

  {
    id: "002",
    slug: "kit-corporativo",
    name: "Kit Corporativo",
    tagline: "Un regalo que representa tu marca y deja una buena impresión.",
    description:
      "Kit personalizado con la identidad visual de tu empresa, para colaboradores, clientes, eventos o equipos de trabajo.",
    longDescription: `El Kit Corporativo está pensado para empresas que quieren regalar algo que hable bien de su marca.

Lo personalizamos con tu logotipo, colores y mensaje, cuidando que cada pieza se vea profesional y bien presentada. Funciona para bienvenidas de colaboradores, aniversarios laborales, clientes, eventos y fechas especiales.

Atendemos desde un detalle individual hasta pedidos por volumen. Escríbenos con la cantidad y la fecha que necesitas y te enviamos una propuesta.`,
    price: 150,
    priceFrom: true,
    currency: "GTQ",
    images: [
      { src: "/images/linartes/kit-corporativo.svg", alt: "Kit Corporativo con logotipo de empresa — foto temporal" },
    ],
    features: [
      { icon: "", label: "Con tu identidad visual",  description: "Logotipo, colores y mensaje de tu marca." },
      { icon: "", label: "Pedidos por volumen",      description: "Desde un detalle hasta eventos y equipos completos." },
      { icon: "", label: "Presentación cuidada",     description: "Una buena impresión desde la entrega." },
      { icon: "", label: "Atención personalizada",   description: "Te acompañamos en la propuesta y el diseño." },
    ],
    personalization: ["Logo", "Colores de marca", "Mensaje"],
    includes: [
      "Artículos seleccionados según tu presupuesto (se confirma al cotizar)",
      "Personalización con logotipo e identidad visual",
      "Empaque de presentación",
    ],
    specs: [
      { name: "Personalización", value: "Logotipo, colores y mensaje" },
      { name: "Pedido mínimo",   value: "Se confirma al cotizar" },
      { name: "Producción",      value: "Según cantidad, se confirma al cotizar" },
      { name: "Entrega",         value: DELIVERY },
    ],
    badge: "EMPRESAS",
    badgeType: "white",
    category: "Corporativos",
    categories: ["corporativos", "sets"] satisfies CategorySlug[],
    tags: ["regalo corporativo", "kit corporativo", "regalos para empresas", "logo"],
    whatsappMessage: "¡Hola Linartes! Quiero cotizar el Kit Corporativo para mi empresa.",
    inStock: true,
    featured: true,
    seo: {
      title: "Kit Corporativo personalizado con tu marca",
      description: "Regalos corporativos personalizados con el logotipo de tu empresa. Pedidos por volumen y envíos a toda Guatemala.",
      keywords: ["regalos corporativos guatemala", "kit corporativo personalizado", "regalos para empresas guatemala"],
    },
  },

  {
    id: "003",
    slug: "marco-giratorio-360",
    name: "Marco Giratorio 360°",
    tagline: "Un recuerdo que se transforma en una experiencia.",
    description:
      "Un marco giratorio personalizado con tus fotos y mensajes, para revivir un momento especial desde todos los ángulos.",
    longDescription: `El Marco Giratorio 360° convierte tus fotos favoritas en un recuerdo que se puede girar, mirar y volver a mirar.

Lo personalizamos con las imágenes, nombres, fechas o frases que elijas, cuidando el diseño para que cada lado cuente una parte de la historia.

Es un regalo ideal para graduaciones, bodas, aniversarios o para celebrar a alguien importante. Envíanos tus fotos y te mostramos el diseño antes de producirlo.`,
    price: 295,
    priceFrom: true,
    currency: "GTQ",
    images: [
      { src: "/images/linartes/marco-giratorio-360.svg", alt: "Marco Giratorio 360° personalizado con fotos — foto temporal" },
    ],
    features: [
      { icon: "", label: "Tus fotos, tu historia",   description: "Personalizado con las imágenes que elijas." },
      { icon: "", label: "Una experiencia",          description: "Un recuerdo que se gira y se vuelve a mirar." },
      { icon: "", label: "Diseño aprobado por ti",   description: "Te enviamos el diseño antes de producir." },
      { icon: "", label: "Para momentos que importan", description: "Graduaciones, bodas, aniversarios." },
    ],
    personalization: ["Fotos", "Nombres", "Fechas", "Frases"],
    includes: [
      "Marco giratorio personalizado",
      "Diseño con tus fotos y textos",
      "Presentación lista para regalar",
    ],
    specs: [
      { name: "Personalización", value: "Fotos, nombres, fechas y frases" },
      { name: "Diseño",          value: "Se aprueba antes de producir" },
      { name: "Producción",      value: "Se confirma al aprobar el diseño" },
      { name: "Entrega",         value: DELIVERY },
    ],
    badge: "NUEVO",
    badgeType: "new",
    category: "Regalos especiales",
    categories: ["regalos-especiales", "graduaciones", "bodas"] satisfies CategorySlug[],
    tags: ["marco giratorio", "marco 360", "marco personalizado", "fotos", "graduacion", "boda"],
    whatsappMessage: "¡Hola Linartes! Me interesa el Marco Giratorio 360°. Quiero personalizarlo con mis fotos.",
    inStock: true,
    featured: true,
    seo: {
      title: "Marco Giratorio 360° personalizado con fotos",
      description: "Marco giratorio 360° personalizado con tus fotos y mensajes. Ideal para graduaciones, bodas y aniversarios en Guatemala.",
      keywords: ["marco giratorio 360 guatemala", "marco personalizado fotos", "regalo graduacion guatemala"],
    },
  },

  {
    id: "004",
    slug: "kit-damas-de-honor",
    name: "Kit para Damas de Honor",
    tagline: "Un detalle pensado para acompañar momentos que se recuerdan para siempre.",
    description:
      "Kit personalizado para invitar o agradecer a tus damas de honor, con su nombre y una presentación especial.",
    longDescription: `El Kit para Damas de Honor es la forma de decir "gracias por estar" a las personas que te acompañan en uno de los días más importantes.

Cada kit se personaliza con el nombre de cada dama, la fecha de la boda o una frase especial, y se presenta de manera que la experiencia comience desde que lo reciben.

Podemos adaptar colores y detalles a la paleta de tu boda. Cuéntanos cuántos kits necesitas y para cuándo, y armamos la propuesta.`,
    price: 225,
    priceFrom: true,
    currency: "GTQ",
    images: [
      { src: "/images/linartes/kit-damas-de-honor.svg", alt: "Kit para Damas de Honor personalizado — foto temporal" },
    ],
    features: [
      { icon: "", label: "Con el nombre de cada una", description: "Un kit único para cada dama de honor." },
      { icon: "", label: "Colores de tu boda",        description: "Adaptamos detalles a tu paleta." },
      { icon: "", label: "Listo para regalar",        description: "La experiencia empieza desde la entrega." },
      { icon: "", label: "Varios kits",               description: "Armamos el grupo completo." },
    ],
    personalization: ["Nombre", "Fecha de la boda", "Frase"],
    includes: [
      "Selección de detalles para dama de honor (se confirma al cotizar)",
      "Personalización con nombre y fecha",
      "Caja de presentación",
    ],
    specs: [
      { name: "Personalización", value: "Nombre, fecha de la boda o frase" },
      { name: "Colores",         value: "Adaptables a la paleta de la boda" },
      { name: "Producción",      value: "Según cantidad, se confirma al cotizar" },
      { name: "Entrega",         value: DELIVERY },
    ],
    badge: "BODAS",
    badgeType: "hot",
    category: "Bodas & damas de honor",
    categories: ["bodas", "sets"] satisfies CategorySlug[],
    tags: ["damas de honor", "kit damas de honor", "boda", "bridesmaid", "regalo personalizado"],
    whatsappMessage: "¡Hola Linartes! Me interesa el Kit para Damas de Honor. ¿Me ayudan a cotizar?",
    inStock: true,
    featured: true,
    seo: {
      title: "Kit para Damas de Honor personalizado",
      description: "Kits personalizados para damas de honor con nombre, fecha y colores de tu boda. Envíos a toda Guatemala.",
      keywords: ["kit damas de honor guatemala", "regalo damas de honor", "bridesmaid box guatemala"],
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getProducts(): Product[] {
  return products.map((p) => ({ ...p, ...getRuntimePrice(p.slug, { price: p.price, priceOriginal: p.priceOriginal }) }));
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return getProducts().filter((p) => p.featured);
}

export function getProductsByCategory(category: CategorySlug): Product[] {
  return getProducts().filter((p) => p.categories.includes(category));
}

export { formatPrice, getDiscountPercent } from "@/lib/utils";
