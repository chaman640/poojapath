"use client";

import { useLang } from "./LanguageProvider";

export default function WhatsappFloat({ whatsapp }: { whatsapp: string }) {
  const { lang } = useLang();
  const number = whatsapp.replace(/\D/g, "");
  const text = encodeURIComponent(
    lang === "hi"
      ? "नमस्ते! मुझे पूजा बुकिंग के बारे में जानकारी चाहिए।"
      : "Namaste! I would like to know more about booking a puja.",
  );

  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lift transition hover:brightness-105 active:scale-95"
      aria-label="WhatsApp"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.09c-.25.69-1.44 1.32-1.99 1.4-.53.08-1.2.11-1.94-.12a17.6 17.6 0 0 1-1.76-.65c-3.1-1.34-5.12-4.46-5.28-4.67-.15-.21-1.26-1.67-1.26-3.19s.8-2.26 1.08-2.57c.28-.31.61-.39.82-.39l.59.01c.19.01.44-.07.69.53.25.6.86 2.08.94 2.23.08.15.13.33.02.54-.1.21-.16.33-.31.51-.16.18-.33.4-.47.54-.15.15-.31.32-.13.63.18.31.79 1.3 1.69 2.11 1.16 1.03 2.14 1.35 2.45 1.5.31.16.49.13.67-.08.18-.21.77-.9.98-1.21.21-.31.41-.26.69-.15.28.1 1.77.83 2.08.98.31.16.51.23.59.36.08.13.08.75-.17 1.44Z" />
      </svg>
      <span className="hidden sm:inline">
        {lang === "hi" ? "सहायता" : "Help"}
      </span>
    </a>
  );
}
