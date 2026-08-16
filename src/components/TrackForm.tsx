"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./LanguageProvider";
import { pick } from "@/lib/i18n";
import { cn, formatDate, formatINR, optimizedImage } from "@/lib/utils";
import type { BookingStatus } from "@/db/schema";

type TrackedBooking = {
  bookingCode: string;
  status: BookingStatus;
  amountInPaise: number;
  pujaTitleEn: string;
  pujaTitleHi: string;
  pujaDate: string;
  artKey: string;
  imageUrl: string | null;
  templeNameEn: string | null;
  templeNameHi: string | null;
};

const DONE = new Set(["COMPLETED", "REFUNDED"]);

export default function TrackForm() {
  const { lang, t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<TrackedBooking[] | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setResults(null);
    setBusy(true);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        const list: TrackedBooking[] = data.bookings ?? [];
        // Ek hi booking ho to seedha uspar le jao
        if (list.length === 1) {
          router.push(`/booking/${encodeURIComponent(list[0].bookingCode)}`);
          return;
        }
        setResults(list);
      } else {
        setError(data.error === "not_found" ? t.track.notFound : data.error || t.track.notFound);
      }
    } catch {
      setError(
        lang === "hi" ? "नेटवर्क समस्या। दोबारा कोशिश करें।" : "Network problem. Please try again.",
      );
    }
    setBusy(false);
  }

  /* ---------------- Results list ---------------- */
  if (results) {
    const pending = results.filter((r) => !DONE.has(r.status));
    const done = results.filter((r) => DONE.has(r.status));

    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[14px] text-ink/60">
            {results.length} {lang === "hi" ? "बुकिंग मिलीं" : "bookings found"}
          </p>
          <button
            type="button"
            onClick={() => {
              setResults(null);
              setPhone("");
            }}
            className="text-[13px] font-semibold text-saffron-700 underline"
          >
            {lang === "hi" ? "दूसरा नंबर" : "Different number"}
          </button>
        </div>

        {pending.length > 0 && (
          <>
            <h2 className="mb-3 text-[15px]">
              {lang === "hi" ? "चल रही पूजाएँ" : "Ongoing pujas"}
            </h2>
            <ul className="space-y-3">
              {pending.map((b) => (
                <BookingRow key={b.bookingCode} b={b} lang={lang} t={t} />
              ))}
            </ul>
          </>
        )}

        {done.length > 0 && (
          <>
            <h2 className="mb-3 mt-8 text-[15px]">
              {lang === "hi" ? "पूरी हो चुकी पूजाएँ" : "Completed pujas"}
            </h2>
            <ul className="space-y-3 opacity-75">
              {done.map((b) => (
                <BookingRow key={b.bookingCode} b={b} lang={lang} t={t} />
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  /* ---------------- Phone form ---------------- */
  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md p-6 sm:p-8">
      <label className="label-lg" htmlFor="phone">
        {t.track.phone}
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        required
        inputMode="numeric"
        maxLength={15}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t.booking.phonePh}
        className="input-lg"
        autoComplete="tel"
      />
      <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
        {lang === "hi"
          ? "वही नंबर डालें जो बुकिंग के समय दिया था — आपकी सारी पूजाएँ दिख जाएँगी।"
          : "Enter the same number you used while booking — all your pujas will show up."}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13.5px] text-red-800"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-big mt-6 bg-gradient-to-r from-saffron-600 to-saffron-500 text-white">
        {busy ? t.common.loading : t.cta.trackBooking}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function BookingRow({
  b,
  lang,
  t,
}: {
  b: TrackedBooking;
  lang: "en" | "hi";
  t: ReturnType<typeof useLang>["t"];
}) {
  const img = optimizedImage(b.imageUrl, 160);
  const temple = pick(lang, b.templeNameEn ?? "", b.templeNameHi ?? "");

  return (
    <li>
      <a
        href={`/booking/${encodeURIComponent(b.bookingCode)}`}
        className="card card-hover flex items-center gap-3 p-3"
      >
        <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-saffron-100 text-2xl">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            "🪔"
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-bold text-maroon-800">
            {pick(lang, b.pujaTitleEn, b.pujaTitleHi)}
          </span>
          {temple && (
            <span className="block truncate text-[12px] text-ink/55">{temple}</span>
          )}
          <span className="mt-1 block text-[12.5px] text-ink/60">
            📅 {formatDate(b.pujaDate, lang)} • {formatINR(b.amountInPaise)}
          </span>
          <span
            className={cn(
              "mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              b.status === "PENDING_PAYMENT"
                ? "bg-amber-100 text-amber-800"
                : DONE.has(b.status)
                  ? "bg-slate-200 text-slate-700"
                  : "bg-green-100 text-green-800",
            )}
          >
            {t.status[b.status]}
          </span>
        </span>

        <span className="shrink-0 text-xl text-saffron-600" aria-hidden="true">
          ›
        </span>
      </a>
    </li>
  );
}
