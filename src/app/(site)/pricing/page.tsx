import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addons, packages, pujas } from "@/db/schema";
import { getLangDict } from "@/lib/lang-server";
import { pick } from "@/lib/i18n";
import { formatDate, formatINR } from "@/lib/utils";
import { siteConfig } from "@/lib/env";
import { getOfferings, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services & Pricing",
  description:
    "Complete list of pujas, add-ons, chadhava and products offered by Pooja Path, with prices in Indian Rupees.",
};

/**
 * Services & Pricing — ek jagah par saari seva aur unke daam.
 * Payment gateway (Paytm/Razorpay) ke KYC me ye page maanga jata hai.
 */
export default async function PricingPage() {
  const { lang } = await getLangDict();
  const hi = lang === "hi";

  const [pujaRows, addonRows, offeringRows, productRows] = await Promise.all([
    db
      .select({
        id: pujas.id,
        slug: pujas.slug,
        titleEn: pujas.titleEn,
        titleHi: pujas.titleHi,
        pujaDate: pujas.pujaDate,
      })
      .from(pujas)
      .where(eq(pujas.isActive, true))
      .orderBy(asc(pujas.pujaDate)),
    db
      .select()
      .from(addons)
      .where(eq(addons.isActive, true))
      .orderBy(asc(addons.order)),
    getOfferings(),
    getProducts(),
  ]);

  const pkgRows = await db
    .select({
      pujaId: packages.pujaId,
      nameEn: packages.nameEn,
      nameHi: packages.nameHi,
      priceInPaise: packages.priceInPaise,
      maxMembers: packages.maxMembers,
    })
    .from(packages)
    .where(eq(packages.isActive, true))
    .orderBy(asc(packages.order));

  const byPuja = new Map<string, typeof pkgRows>();
  for (const p of pkgRows) {
    if (!byPuja.has(p.pujaId)) byPuja.set(p.pujaId, []);
    byPuja.get(p.pujaId)!.push(p);
  }

  return (
    <>
      <section className="bg-temple-gradient py-10 text-center text-saffron-50 sm:py-14">
        <div className="container-x">
          <h1 className="font-display text-3xl text-gold-100 sm:text-4xl">
            {hi ? "सेवाएँ एवं मूल्य सूची" : "Services & Pricing"}
          </h1>
          <div className="divider-gold mt-4" />
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-saffron-100/80">
            {hi
              ? "सभी मूल्य भारतीय रुपये (INR) में हैं और उनमें कर सम्मिलित है। कोई छिपा हुआ शुल्क नहीं।"
              : "All prices are in Indian Rupees (INR) and inclusive of taxes. There are no hidden charges."}
          </p>
        </div>
      </section>

      <div className="container-x max-w-4xl space-y-12 py-12">
        {/* ---------- Pujas ---------- */}
        <section>
          <h2 className="text-2xl">{hi ? "पूजा सेवाएँ" : "Puja Services"}</h2>
          <div className="mt-3 h-px w-24 bg-gold-line" />
          <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
            {hi
              ? "प्रत्येक पूजा में संकल्प में आपका नाम व गोत्र, पूरी पूजा का वीडियो, प्रसाद तथा संपन्नता प्रमाण-पत्र सम्मिलित है।"
              : "Every puja includes your name and gotra in the sankalp, the full puja video, temple prasad and a completion certificate."}
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-saffron-100 bg-white">
            <table className="w-full text-[13.5px]">
              <thead className="bg-saffron-50/60 text-left text-[11px] uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3 font-bold">{hi ? "पूजा" : "Puja"}</th>
                  <th className="px-4 py-3 font-bold">{hi ? "तिथि" : "Date"}</th>
                  <th className="px-4 py-3 font-bold">{hi ? "पैकेज" : "Packages"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-50">
                {pujaRows.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/pujas/${p.slug}`}
                        className="font-semibold text-maroon-800 hover:text-saffron-700"
                      >
                        {pick(lang, p.titleEn, p.titleHi)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink/60">
                      {formatDate(p.pujaDate, lang)}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {(byPuja.get(p.id) ?? []).map((k) => (
                          <li key={k.nameEn} className="flex justify-between gap-4">
                            <span className="text-ink/70">
                              {pick(lang, k.nameEn, k.nameHi)}
                              <span className="text-ink/40">
                                {" "}
                                ({k.maxMembers} {hi ? "तक" : "max"})
                              </span>
                            </span>
                            <span className="shrink-0 font-semibold text-maroon-800">
                              {formatINR(k.priceInPaise)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- Add-ons ---------- */}
        {addonRows.length > 0 && (
          <section>
            <h2 className="text-2xl">{hi ? "अतिरिक्त सेवाएँ (Add-ons)" : "Add-on Services"}</h2>
            <div className="mt-3 h-px w-24 bg-gold-line" />
            <p className="mt-3 text-[14px] text-ink/65">
              {hi
                ? "बुकिंग के समय वैकल्पिक रूप से जोड़ी जा सकती हैं।"
                : "These can optionally be added at the time of booking."}
            </p>

            <ul className="mt-5 divide-y divide-saffron-50 rounded-2xl border border-saffron-100 bg-white">
              {addonRows.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-[14px] font-semibold text-maroon-800">
                      {a.kind === "DELIVERY" ? "📦" : "🛕"}{" "}
                      {pick(lang, a.nameEn, a.nameHi)}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-ink/55">
                      {pick(lang, a.descEn, a.descHi)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-maroon-800">
                    {formatINR(a.priceInPaise)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- Chadhava ---------- */}
        {offeringRows.length > 0 && (
          <section>
            <h2 className="text-2xl">{hi ? "चढ़ावा" : "Chadhava & Offerings"}</h2>
            <div className="mt-3 h-px w-24 bg-gold-line" />
            <ul className="mt-5 divide-y divide-saffron-50 rounded-2xl border border-saffron-100 bg-white">
              {offeringRows.map((o) => (
                <li key={o.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-[14px] font-semibold text-maroon-800">
                      {pick(lang, o.titleEn, o.titleHi)}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-ink/55">
                      {pick(lang, o.templeNameEn, o.templeNameHi)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-maroon-800">
                    {formatINR(o.priceInPaise)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- Products ---------- */}
        {productRows.length > 0 && (
          <section>
            <h2 className="text-2xl">{hi ? "दिव्य भंडार" : "Divine Store"}</h2>
            <div className="mt-3 h-px w-24 bg-gold-line" />
            <ul className="mt-5 divide-y divide-saffron-50 rounded-2xl border border-saffron-100 bg-white">
              {productRows.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-[14px] font-semibold text-maroon-800">
                      {pick(lang, p.nameEn, p.nameHi)}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-ink/55">
                      {pick(lang, p.groupEn, p.groupHi)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-maroon-800">
                    {formatINR(p.priceInPaise)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- Notes ---------- */}
        <section className="rounded-2xl bg-saffron-50 p-6">
          <h2 className="text-lg">{hi ? "मूल्य संबंधी जानकारी" : "Pricing information"}</h2>
          <ul className="prose-devotional mt-3 space-y-1.5 text-[14px]">
            <li>
              {hi
                ? "सभी मूल्य भारतीय रुपये (INR) में हैं और कर सहित हैं।"
                : "All prices are in Indian Rupees (INR) and inclusive of applicable taxes."}
            </li>
            <li>
              {hi
                ? "भारत में प्रसाद की डिलीवरी निःशुल्क है। कोई अतिरिक्त शिपिंग शुल्क नहीं।"
                : "Prasad delivery within India is free. No extra shipping charges."}
            </li>
            <li>
              {hi
                ? "भुगतान बुकिंग के समय ही लिया जाता है। कोई आवर्ती (recurring) शुल्क नहीं।"
                : "Payment is collected only at the time of booking. There are no recurring charges."}
            </li>
            <li>
              {hi ? (
                <>
                  रद्दीकरण एवं धनवापसी की शर्तें{" "}
                  <Link href="/legal/refund" className="font-semibold text-saffron-700 underline">
                    रिफंड नीति
                  </Link>{" "}
                  में दी गई हैं।
                </>
              ) : (
                <>
                  Cancellation and refund terms are given in our{" "}
                  <Link href="/legal/refund" className="font-semibold text-saffron-700 underline">
                    Refund Policy
                  </Link>
                  .
                </>
              )}
            </li>
          </ul>

          <p className="mt-4 text-[13px] text-ink/60">
            {hi ? "प्रश्न हों तो संपर्क करें" : "Questions? Contact us at"}: {siteConfig.email} •{" "}
            {siteConfig.phone}
          </p>
        </section>
      </div>
    </>
  );
}
