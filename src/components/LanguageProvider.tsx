"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getDict, LANG_COOKIE, type Dict, type Lang } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  t: Dict;
  switching: boolean;
  toggle: () => void;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  const router = useRouter();
  const [switching, startTransition] = useTransition();

  const toggle = () => {
    const next: Lang = lang === "hi" ? "en" : "hi";
    // 1 saal ke liye yaad rakho
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <LanguageContext.Provider value={{ lang, t: getDict(lang), switching, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang ko LanguageProvider ke andar use karein");
  return ctx;
}
