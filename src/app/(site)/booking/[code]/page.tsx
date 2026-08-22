import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookingEvents, bookings } from "@/db/schema";
import PujaImage from "@/components/PujaImage";
import BookingTimeline from "@/components/BookingTimeline";
import BookingPendingWatch from "@/components/BookingPendingWatch";
import BookingWhatsapp from "@/components/BookingWhatsapp";
import PixelEvent from "@/components/PixelEvent";
import { reconcileByBookingCode } from "@/lib/payments/reconcile";
import { getLangDict } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { formatDate, formatINR, maskPhone } from "@/lib/utils";
import { siteConfig } from "@/lib/env";
import { getBookingAddons, getBookingByCode } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Booking Status",
  robots: { index: false, follow: false },
};

type Params = Promise<{ code: string }>;
type Search = Promise<{
  paid?: string;
  pending?: string;
  failed?: string;
  wa?: string;
}>;

export default async function BookingStatusPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const { lang, t } = await getLangDict();

  const plainCode = decodeURIComponent(code);

  /**
   * Page khulte hi gateway se poochh lo ki paisa aaya ya nahi.
   *
   * Callback ya webhook chuk bhi jaye to booking yahin apne aap confirm
   * ho jati hai — user ko "payment pending" dekh kar ghabrana nahi padta.
   * Gateway se baat na ho paye to chup-chaap aage badh jate hain.
   */
  await reconcileByBookingCode(plainCode).catch(() => null);

  const data = await getBookingByCode(plainCode);
  if (!data) notFound();

  const { booking, puja, pkg, templeNameEn, templeNameHi } = data;

  const [events, extras, [freshRow]] = await Promise.all([
    db
      .select()
      .from(bookingEvents)
      .where(eq(bookingEvents.bookingId, booking.id))
      .orderBy(bookingEvents.createdAt),
    getBookingAddons(booking.id),
    // "Abhi-abhi confirm hui?" — samay ka hisaab database karta hai,
    // taaki page ka render pure rahe (React ki shart).
    db
      .select({
        fresh: sql<boolean>`${bookings.updatedAt} > now() - interval '5 minutes'`,
      })
      .from(bookings)
      .where(eq(bookings.id, booking.id))
      .limit(1),
  ]);

  const title = pick(lang, puja.titleEn, puja.titleHi);
  const temple = pick(lang, templeNameEn ?? "", templeNameHi ?? "");
  const isConfirmed = booking.status !== "PENDING_PAYMENT";
  const waNumber = siteConfig.whatsapp.replace(/\D/g, "");
  const paymentPending = sp.pending === "1" && !isConfirmed;
  const paymentFailed = sp.failed === "1" && !isConfirmed;

  /**
   * Abhi-abhi payment karke aaye hain? To WhatsApp apne aap khul jayega.
   *
   * Do halaat me khulta hai:
   *   • Razorpay ka callback `?paid=1` lagakar bhejta hai, ya
   *   • booking pichhle 5 minute me confirm hui ho (callback toot gaya
   *     ho aur reconcile ne abhi confirm ki ho — tab bhi grahak payment
   *     karke hi aaya hoga)
   *
   * Ek baar chalne ke baad URL me `wa=done` lag jata hai, isliye refresh
   * ya back dabane par dobara nahi khulta.
   */
  const openWhatsapp =
    isConfirmed &&
    sp.wa !== "done" &&
    (sp.paid === "1" || Boolean(freshRow?.fresh));

  /**
   * "Details save karein" — user ke tap karte hi WhatsApp khulta hai aur
   * poori booking admin ke number par chali jati hai. Isse admin ke paas
   * har booking WhatsApp me bhi save ho jati hai.
   */
  const saveDetailsText = [
    `🪔 ${t.brand} — ${lang === "hi" ? "बुकिंग विवरण" : "Booking details"}`,
    "",
    `${lang === "hi" ? "बुकिंग आईडी" : "Booking ID"}: ${booking.bookingCode}`,
    `${lang === "hi" ? "नाम" : "Name"}: ${booking.devoteeName}`,
    `${lang === "hi" ? "गोत्र" : "Gotra"}: ${booking.gotra}`,
    `${lang === "hi" ? "मोबाइल" : "Mobile"}: ${booking.phone}`,
    ...(booking.memberNames.length
      ? [`${lang === "hi" ? "सदस्य" : "Members"}: ${booking.memberNames.join(", ")}`]
      : []),
    "",
    `${lang === "hi" ? "पूजा" : "Puja"}: ${title}`,
    ...(temple ? [`${lang === "hi" ? "मंदिर" : "Temple"}: ${temple}`] : []),
    `${lang === "hi" ? "पूजा तिथि" : "Puja date"}: ${formatDate(puja.pujaDate, lang)}`,
    `${lang === "hi" ? "पैकेज" : "Package"}: ${pick(lang, pkg.nameEn, pkg.nameHi)}`,
    ...(extras.length
      ? [
          `${lang === "hi" ? "अतिरिक्त" : "Add-ons"}: ${extras
            .map((x) => pick(lang, x.nameEn, x.nameHi))
            .join(", ")}`,
        ]
      : []),
    `${lang === "hi" ? "कुल राशि" : "Total"}: ${formatINR(booking.amountInPaise)}`,
    ...(booking.addressLine
      ? [
          "",
          `${lang === "hi" ? "पता" : "Address"}: ${[
            booking.addressLine,
            booking.city,
            booking.state,
            booking.pincode,
          ]
            .filter(Boolean)
            .join(", ")}`,
        ]
      : []),
    ...(booking.sankalp ? ["", `${lang === "hi" ? "संकल्प" : "Sankalp"}: ${booking.sankalp}`] : []),
  ].join("\n");

  const saveDetailsLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(saveDetailsText)}`;

  return (
    <div className="container-x max-w-4xl py-10 sm:py-14">
      {/*
        Meta ko bikri ki khabar — sirf jab booking sach me confirm ho.
        `once` me booking code hai, isliye page refresh karne par ye
        dobara nahi jata (warna Ads Manager me nakli bikri dikhne lagti
        hai, aur Meta usi galat data par optimize karta rehta hai).
      */}
      {isConfirmed && (
        <PixelEvent
          event="Purchase"
          once={booking.bookingCode}
          value={booking.amountInPaise / 100}
          contentName={puja.titleEn}
          contentIds={[puja.slug]}
        />
      )}

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
            ? "अपना मोबाइल नंबर डालकर आप कभी भी इस पूजा की स्थिति देख सकते हैं।"
            : "You can check this puja's status anytime by entering your mobile number."}
        </p>

        {/* -------- Details WhatsApp par bhejein -------- */}
        {isConfirmed && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-dashed border-[#25D366]/40 bg-white/70 p-4">
            <p className="text-[13.5px] font-bold text-maroon-800">
              {lang === "hi"
                ? "📲 अपना विवरण हमें भेज दें"
                : "📲 Send your details to us"}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/60">
              {lang === "hi"
                ? "एक बार दबाइए — व्हाट्सएप खुलेगा और आपकी पूरी बुकिंग हमारे पास पहुँच जाएगी। इससे पंडित जी को आपका नाम, गोत्र और पूजा की तिथि मिल जाएगी।"
                : "One tap — WhatsApp opens with your full booking ready to send. This gives our pandit ji your name, gotra and puja date."}
            </p>
            <a
              href={saveDetailsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-big mt-4 bg-[#25D366] text-white hover:brightness-105"
            >
              {lang === "hi" ? "व्हाट्सएप पर भेजें" : "Send on WhatsApp"}
            </a>
          </div>
        )}
      </div>

      {/* Payment karke abhi aaye hain — WhatsApp apne aap khol dete hain */}
      {openWhatsapp && (
        <BookingWhatsapp link={saveDetailsLink} hi={lang === "hi"} />
      )}

      {/* Pending ho to page chup-chaap refresh hota rahega — jaise hi
          Razorpay "paisa mil gaya" kahega, booking apne aap confirm dikhegi */}
      {!isConfirmed && <BookingPendingWatch />}

      {/* -------- Payment ke baad ke messages -------- */}
      {paymentPending && (
        <p className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-[14px] leading-relaxed text-amber-900">
          ⏳{" "}
          {lang === "hi"
            ? "भुगतान की पुष्टि हो रही है। बैंक से जवाब आते ही आपकी बुकिंग अपने आप कन्फर्म हो जाएगी — यह पेज थोड़ी देर बाद दोबारा खोलें। पैसा कट गया हो तो चिंता न करें, राशि सुरक्षित है।"
            : "Your payment is being confirmed. As soon as the bank responds your booking will confirm automatically — reopen this page in a little while. If money was deducted, it is safe."}
        </p>
      )}

      {paymentFailed && (
        <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-[14px] leading-relaxed text-red-800">
          <p className="font-bold">
            {lang === "hi" ? "भुगतान पूरा नहीं हुआ" : "Payment did not go through"}
          </p>
          <p className="mt-1">
            {lang === "hi"
              ? "आपकी बुकिंग सुरक्षित है। दोबारा प्रयास करें — कोई राशि नहीं कटी है।"
              : "Your booking is saved. Please try again — no amount has been deducted."}
          </p>
          <Link href={`/pujas/${puja.slug}`} className="btn-primary mt-3 px-5 py-2.5">
            {lang === "hi" ? "दोबारा भुगतान करें" : "Try payment again"}
          </Link>
        </div>
      )}

      {/* -------- Details -------- */}
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <div className="card overflow-hidden">
          <PujaImage
            imageUrl={puja.imageUrl}
            artKey={puja.artKey}
            alt={title}
            width={640}
            className="aspect-[16/9] w-full"
          />
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

            {extras.length > 0 && (
              <div className="mt-4 rounded-xl bg-saffron-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-saffron-700">
                  {lang === "hi" ? "अतिरिक्त सामान / सेवा" : "Extra items & seva"}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {extras.map((x) => (
                    <li key={x.id} className="flex justify-between gap-3 text-[13px]">
                      <span className="text-ink/70">
                        {x.kind === "DELIVERY" ? "📦" : "🪔"}{" "}
                        {pick(lang, x.nameEn, x.nameHi)}
                      </span>
                      <span className="shrink-0 font-semibold text-maroon-800">
                        {formatINR(x.priceInPaise)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
