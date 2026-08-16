import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import PayBox from "@/components/PayBox";
import { getBookingByCode } from "@/lib/queries";
import { getLangDict } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { formatINR } from "@/lib/utils";
import { activeProvider, createPaymentSession, razorpay } from "@/lib/payments";
import type { PaymentSession } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Payment ka apna alag page.
 *
 * ══════════════════════════════════════════════════════════════════
 *  Ye page alag kyun hai
 * ══════════════════════════════════════════════════════════════════
 *
 * Pehle payment booking wizard ke andar hi hota tha. Uski do badi
 * kamzoriyan thi:
 *
 *  1. **Page khali ho jaye to sab khatam.** UPI app kholte waqt browser
 *     kabhi-kabhi tab hi khali kar deta hai ("Can't open payment app").
 *     Wizard ki saari jaankari sirf memory me thi, isliye grahak ke paas
 *     lautne ka koi raasta nahi bachta tha.
 *
 *  2. **Dobara koshish karna mushkil tha** — poora form phir se bharna
 *     padta tha.
 *
 *  Ab payment ka apna pata hai: `/pay/PP-260816-XXXXXX`.
 *
 *  • Page khali ho jaye → **Back dabao**, seedha yahin wapas.
 *  • Tab band ho jaye → history se dobara khol lo.
 *  • Dobara pay karna ho → wahi button, wahi page. Form dobara nahi.
 *  • Jaanch page khulte hi shuru ho jati hai — Razorpay kuch bataye ya
 *    na bataye, isse farak nahi padta.
 *
 * Booking pehle hi ban chuki hoti hai (wizard ne bana di), isliye yahan
 * paisa hi baaki hai — grahak ka data kabhi nahi khota.
 */

type Params = Promise<{ code: string }>;

export default async function PayPage({ params }: { params: Params }) {
  const { code } = await params;
  const plainCode = decodeURIComponent(code).toUpperCase();
  const { lang, t } = await getLangDict();

  const data = await getBookingByCode(plainCode);
  if (!data) notFound();

  const { booking, puja, pkg } = data;

  // Paisa pehle hi aa chuka hai? Seedha booking page — wahan WhatsApp khulega.
  if (booking.status !== "PENDING_PAYMENT") {
    redirect(`/booking/${booking.bookingCode}?paid=1`);
  }

  /**
   * Gateway ka order taiyar rakho.
   *
   * Wizard ne banaya tha to wahi dobara use hota hai — ek hi order par
   * kai koshishein ho sakti hain, aur isse Razorpay par bhi hisaab saaf
   * rehta hai. Kisi wajah se na bana ho to yahin bana lete hain.
   */
  const provider = activeProvider();
  let session: PaymentSession | null = null;
  let setupError = "";

  if (provider === "none") {
    session = { mode: "demo" };
  } else if (provider === "razorpay" && booking.providerOrderId) {
    session = {
      mode: "razorpay",
      orderId: booking.providerOrderId,
      amount: booking.amountInPaise,
      currency: "INR",
      keyId: razorpay.publicKeyId(),
    };
  } else {
    try {
      const made = await createPaymentSession({
        bookingCode: booking.bookingCode,
        amountInPaise: booking.amountInPaise,
        pujaTitle: puja.titleEn,
      });
      session = made.session;
      if (made.providerOrderId && made.providerOrderId !== booking.providerOrderId) {
        await db
          .update(bookings)
          .set({
            providerOrderId: made.providerOrderId,
            paymentStatus: "CREATED",
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id));
      }
    } catch (err) {
      console.error("[pay] session banane me dikkat:", err);
      setupError =
        lang === "hi"
          ? "भुगतान गेटवे से जुड़ नहीं पाए। थोड़ी देर बाद इसी पेज को रिफ़्रेश करें।"
          : "Could not reach the payment gateway. Refresh this page in a little while.";
    }
  }

  const title = pick(lang, puja.titleEn, puja.titleHi);
  const packageName = pick(lang, pkg.nameEn, pkg.nameHi);

  return (
    <div className="container-x max-w-lg py-10 sm:py-14">
      <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft sm:p-7">
        <p className="text-[12px] font-bold uppercase tracking-wide text-saffron-700">
          {lang === "hi" ? "भुगतान" : "Payment"}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-maroon-800">
          {lang === "hi" ? "बुकिंग पक्की करें" : "Complete your booking"}
        </h1>

        {/* -------- Kya book ho raha hai -------- */}
        <dl className="mt-5 space-y-2.5 rounded-2xl bg-saffron-50/70 p-4 text-[14px]">
          <Row label={lang === "hi" ? "पूजा" : "Puja"} value={title} />
          <Row label={lang === "hi" ? "पैकेज" : "Package"} value={packageName} />
          <Row label={lang === "hi" ? "नाम" : "Name"} value={booking.devoteeName} />
          <Row label={lang === "hi" ? "गोत्र" : "Gotra"} value={booking.gotra} />
          <Row label={lang === "hi" ? "मोबाइल" : "Mobile"} value={booking.phone} />
          <div className="flex items-baseline justify-between border-t border-saffron-200/70 pt-2.5">
            <dt className="font-bold text-maroon-800">
              {lang === "hi" ? "कुल राशि" : "Total"}
            </dt>
            <dd className="font-display text-xl font-bold text-maroon-800">
              {formatINR(booking.amountInPaise)}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-center text-[12px] text-ink/50">
          {lang === "hi" ? "बुकिंग आईडी" : "Booking ID"}:{" "}
          <span className="font-mono font-semibold text-ink/70">{booking.bookingCode}</span>
        </p>

        {setupError ? (
          <p
            role="alert"
            className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-[14px] leading-relaxed text-red-800"
          >
            {setupError}
          </p>
        ) : (
          <PayBox
            code={booking.bookingCode}
            amountLabel={formatINR(booking.amountInPaise)}
            brand={t.brand}
            pujaTitle={title}
            devoteeName={booking.devoteeName}
            phone={booking.phone}
            email={booking.email}
            session={session!}
            hi={lang === "hi"}
          />
        )}

        <p className="mt-5 text-center text-[12px] leading-relaxed text-ink/45">
          {lang === "hi"
            ? "यह पेज बंद हो जाए तो घबराएँ नहीं — यही पता दोबारा खोलने पर भुगतान वहीं से चलता रहेगा।"
            : "If this page closes, don't worry — reopening this same address picks up right where you left off."}
        </p>

        <p className="mt-3 text-center">
          <Link
            href={`/booking/${booking.bookingCode}`}
            className="text-[13px] font-semibold text-maroon-700 underline underline-offset-2"
          >
            {lang === "hi" ? "बुकिंग की स्थिति देखें" : "View booking status"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ink/55">{label}</dt>
      <dd className="text-right font-semibold text-ink/85">{value}</dd>
    </div>
  );
}
