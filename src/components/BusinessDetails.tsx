import { siteConfig } from "@/lib/env";
import type { Lang } from "@/lib/i18n";

/**
 * Vyapaar ki jaankari — payment gateway (Paytm/Razorpay) ke KYC ke liye
 * site par dikhna zaroori hota hai. Values .env se aati hain.
 */
export default function BusinessDetails({
  lang,
  compact = false,
}: {
  lang: Lang;
  compact?: boolean;
}) {
  const hi = lang === "hi";

  const rows: Array<[string, string]> = [
    [hi ? "व्यापार का नाम" : "Business name", siteConfig.legalName],
    ...(siteConfig.address
      ? ([[hi ? "पता" : "Registered address", siteConfig.address]] as Array<[string, string]>)
      : []),
    [hi ? "फ़ोन" : "Phone", siteConfig.phone],
    [hi ? "ईमेल" : "Email", siteConfig.email],
    ...(siteConfig.gstin
      ? ([["GSTIN", siteConfig.gstin]] as Array<[string, string]>)
      : []),
  ];

  if (compact) {
    return (
      <div className="text-[12.5px] leading-relaxed text-ink/60">
        <p className="font-semibold text-maroon-800">{siteConfig.legalName}</p>
        {siteConfig.address && <p>{siteConfig.address}</p>}
        <p>
          {siteConfig.phone} • {siteConfig.email}
        </p>
        {siteConfig.gstin && <p>GSTIN: {siteConfig.gstin}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-saffron-100 bg-white p-5">
      <h3 className="text-[15px]">
        {hi ? "व्यापार की जानकारी" : "Business details"}
      </h3>
      <dl className="mt-3 space-y-2 text-[13.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-wrap gap-x-3">
            <dt className="w-40 shrink-0 text-ink/50">{k}</dt>
            <dd className="min-w-0 font-medium text-maroon-800">{v}</dd>
          </div>
        ))}
      </dl>
      {!siteConfig.address && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          ⚠️ Pata abhi set nahi hai. Payment gateway approval ke liye{" "}
          <code>NEXT_PUBLIC_BUSINESS_ADDRESS</code> me apna poora pata daalein.
        </p>
      )}
    </div>
  );
}
