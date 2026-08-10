import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookingEvents } from "@/db/schema";
import SacredArt from "@/components/SacredArt";
import BookingTimeline from "@/components/BookingTimeline";
import { getLangDict } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { formatDate, formatINR, maskPhone } from "@/lib/utils";
import { siteConfig } from "@/lib/env";
import { getBookingByCode } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Booking Status",
  robots: { index: false, follow: false },
};

type Params = Promise<{ code: string }>;

export default async function BookingStatusPage({ params }: { params: Params }) {
  const { code } = await params;
  const { lang, t } = await getLangDict();

  const data = await getBookingByCode(decodeURIComponent(code));
  if (!data) notFound();

  const { booking, puja, pkg, templeNameEn, templeNameHi } = data;

  const events = await db
    .select()
    .from(bookingEvents)
    .where(eq(bookingEvents.bookingId, booking.id))
    .orderBy(bookingEvents.createdAt);

  const title = pick(lang, puja.titleEn, puja.titleHi);
  const temple = pick(lang, templeNameEn ?? "", templeNameHi ?? "");
  const isConfirmed = booking.status !== "PENDING_PAYMENT";
  const waNumber = siteConfig.whatsapp.replace(/\D/g, "");

  return (
    <div className="container-x max-w-4xl py-10 sm:py-14">
      {/* -------- Success banner -------- */}
      <div
        className={
          isConfirmed
            ? "rounded-3xl bg-gradient-to-br from-green-50 to-saffron-50 p-7 text-center ring-1 ring-green-200"
            : "rounded-3xl bg-amber-50 p-7 text-center ring-1 ring-amber-300"
        }
      >
        <span className="text-5xl">{isConfirmed ? "🪔" : "⏳"}</span>
        <h1 className="mt-4 text-2xl sm:text-3xl">
          {isConfirmed
            ? lang === "hi"
              ? "आपकी बुकिंग हो गई!"
              : "Your booking is confirmed!"
            : lang === "hi"
              ? "भुगतान अधूरा है"
              : "Payment incomplete"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-ink/70">
          {isConfirmed
            ? lang === "hi"
              ? `पंडित जी संकल्प में ${booking.devoteeName} (${booking.gotra} गोत्र) का नाम लेंगे। सारी अपडेट ${maskPhone(booking.phone)} पर व्हाट्सएप से भेजी जाएँगी।`
              : `The pandit ji will take the name of ${booking.devoteeName} (${booking.gotra} gotra) in the sankalp. All updates will be sent on WhatsApp to ${maskPhone(booking.phone)}.`
            : lang === "hi"
              ? "आपकी बुकिंग सुरक्षित है, लेकिन भुगतान पूरा नहीं हुआ। कृपया दोबारा प्रयास करें या हमें व्हाट्सएप करें।"
              : "Your booking is saved but payment was not completed. Please try again or message us on WhatsApp."}
        </p>

        <div className="mt-6 inline-flex flex-col items-center rounded-2xl border-2 border-dashed border-saffron-300 bg-white px-8 py-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
            {t.track.code}
          </span>
          <span className="mt-1 font-display text-2xl font-bold tracking-wider text-maroon-800">
            {booking.bookingCode}
          </span>
        </div>

        <p className="mt-3 text-[12px] text-ink/50">
          {lang === "hi"
            ? "इस आईडी को सुरक्षित रखें — इसी से आप कभी भी स्थिति देख सकते हैं।"
            : "Save this ID — you can check your status with it anytime."}
        </p>
      </div>

      {/* -------- Details -------- */}
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <div className="card overflow-hidden">
          <SacredArt artKey={puja.artKey} className="aspect-[16/9] w-full" />
          <div className="p-5">
            <h2 className="text-base leading-snug">{title}</h2>
            {temple && (
              <p className="mt-1.5 text-[12px] font-bold uppercase tracking-wide text-saffron-700">
                {temple}
              </p>
            )}

            <dl className="mt-4 space-y-2.5 text-[13.5px]">
              {[
                { k: t.common.date, v: formatDate(puja.pujaDate, lang) },
                { k: lang === "hi" ? "पैकेज" : "Package", v: pick(lang, pkg.nameEn, pkg.nameHi) },
                { k: t.booking.name, v: booking.devoteeName },
                { k: t.booking.gotra, v: booking.gotra },
                ...(booking.memberNames.length
                  ? [{ k: t.booking.members, v: booking.memberNames.join(", ") }]
                  : []),
                { k: t.booking.total, v: formatINR(booking.amountInPaise) },
              ].map((row) => (
                <div key={row.k} className="flex justify-between gap-4 border-b border-saffron-50 pb-2">
                  <dt className="shrink-0 text-ink/55">{row.k}</dt>
                  <dd className="text-right font-semibold text-maroon-800">{row.v}</dd>
                </div>
              ))}
            </dl>

            {booking.sankalp && (
              <div className="mt-4 rounded-xl bg-saffron-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-saffron-700">
                  {t.booking.sankalp}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink/70">
                  {booking.sankalp}
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <BookingTimeline lang={lang} status={booking.status} events={events} />

          {booking.videoUrl && (
            <a
              href={booking.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-5 w-full py-3"
            >
              🎬 {lang === "hi" ? "पूजा वीडियो देखें" : "Watch Puja Video"}
            </a>
          )}

          {booking.prasadTracking && (
            <p className="mt-4 rounded-xl border border-saffron-200 bg-white px-4 py-3 text-[13px]">
              📦 {lang === "hi" ? "प्रसाद ट्रैकिंग" : "Prasad tracking"}:{" "}
              <span className="font-bold text-maroon-800">{booking.prasadTracking}</span>
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                `Booking ${booking.bookingCode}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white hover:brightness-105"
            >
              {t.cta.talkToUs}
            </a>
            <Link href="/pujas" className="btn-secondary">
              {t.cta.viewAll}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
