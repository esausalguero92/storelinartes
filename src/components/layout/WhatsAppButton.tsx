import { buildWhatsAppUrl } from "@/lib/utils";
import { SITE } from "@/config/site";
import { IconWhatsApp } from "@/components/ui/Icons";

export default function WhatsAppButton() {
  const url = buildWhatsAppUrl(SITE.whatsapp, SITE.whatsappDefaultMsg);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition-transform duration-300 hover:scale-105"
    >
      <IconWhatsApp className="h-7 w-7" />
    </a>
  );
}
