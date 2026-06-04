import { MessageCircle } from "lucide-react";

const WA = "254790179834";

export function WhatsAppFloating() {
  return (
    <a
      href={`https://wa.me/${WA}?text=${encodeURIComponent(
        "Hi NorthGo, I'd like help booking my Isiolo ⇄ Nairobi trip.",
      )}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with NorthGo on WhatsApp"
      className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl ring-4 ring-[#25D366]/20 transition hover:scale-105 md:bottom-6 md:right-6 md:h-16 md:w-16"
    >
      <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-30" />
    </a>
  );
}
