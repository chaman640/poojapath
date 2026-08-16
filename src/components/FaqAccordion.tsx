"use client";

import { useState } from "react";
import { useLang } from "./LanguageProvider";
import { pick } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Faq } from "@/db/schema";

export default function FaqAccordion({ items }: { items: Faq[] }) {
  const { lang } = useLang();
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-3xl divide-y divide-saffron-100 overflow-hidden rounded-2xl border border-saffron-100 bg-white shadow-soft">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-saffron-50/60 sm:px-6"
              >
                <span className="text-[15px] font-semibold text-maroon-800">
                  {pick(lang, item.questionEn, item.questionHi)}
                </span>
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-saffron-200 text-saffron-700 transition-transform duration-300",
                    isOpen && "rotate-45 bg-saffron-100",
                  )}
                  aria-hidden="true"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </h3>

            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-[14px] leading-[1.8] text-ink/70 sm:px-6">
                  {pick(lang, item.answerEn, item.answerHi)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
