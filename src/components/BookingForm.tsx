"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./LanguageProvider";
import { pick } from "@/lib/i18n";
import { cn, formatINR } from "@/lib/utils";

type Pkg = {
  id: string;
  nameEn: string;
  nameHi: string;
  priceInPaise: number;
  mrpInPaise: number | null;
  maxMembers: number;
  featuresEn: string[];
  featuresHi: string[];
  isPopular: boolean;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BookingForm({
  pujaSlug,
  pujaTitle,
  packages,
  paymentLive,
}: {
  pujaSlug: string;
  pujaTitle: string;
  packages: Pkg[];
  paymentLive: boolean;
}) {
  const { lang, t } = useLang();
  const router = useRouter();

  const [packageId, setPackageId] = useState(
    packages.find((p) => p.isPopular)?.id ?? packages[0]?.id ?? "",
  );
  const [members, setMembers] = useState<string[]>([]);
  const [showAddress, setShowAddress] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => packages.find((p) => p.id === packageId) ?? packages[0],
    [packageId, packages],
  );

  const extraSlots = Math.max((selected?.maxMembers ?? 1) - 1, 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      pujaSlug,
      packageId,
      devoteeName: String(fd.get("devoteeName") ?? ""),
      gotra: String(fd.get("gotra") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      memberNames: members.map((m) => m.trim()).filter(Boolean),
      sankalp: String(fd.get("sankalp") ?? ""),
      addressLine: String(fd.get("addressLine") ?? ""),
      city: String(fd.get("city") ?? ""),
      state: String(fd.get("state") ?? ""),
      pincode: String(fd.get("pincode") ?? ""),
      whatsappOptIn: fd.get("whatsappOptIn") === "on",
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Booking nahi ho payi. Dobara koshish karein.");
        setBusy(false);
        return;
      }

      if (data.payment?.mode === "demo") {
        router.push(`/booking/${data.bookingCode}`);
        return;
      }

      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        setError("Payment window load nahi hui. Internet check karke dobara try karein.");
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.payment.keyId,
        amount: data.payment.amount,
        currency: data.payment.currency,
        name: "Pooja Path",
        description: pujaTitle.slice(0, 120),
        order_id: data.payment.orderId,
        prefill: {
          name: payload.devoteeName,
          contact: payload.phone,
          email: payload.email || undefined,
        },
        notes: { bookingCode: data.bookingCode },
        theme: { color: "#C2410C" },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError(
              lang === "hi"
                ? "भुगतान रद्द हुआ। आपकी बुकिंग सुरक्षित है — दोबारा प्रयास करें।"
                : "Payment cancelled. Your booking is saved — you can try again.",
            );
          },
        },
        handler: async (response: Record<string, string>) => {
          const verify = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const vd = await verify.json();
          if (verify.ok && vd.ok) {
            router.push(`/booking/${vd.bookingCode}`);
          } else {
            setBusy(false);
            setError(vd.error || "Payment verify nahi hua. Support se sampark karein.");
          }
        },
      });

      rzp.open();
    } catch {
      setError("Network problem. Dobara koshish karein.");
      setBusy(false);
    }
  }

  if (!selected) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* ---------- Packages ---------- */}
      <div>
        <h3 className="mb-4 text-lg">{t.common.packages}</h3>
        <div className="space-y-3">
          {packages.map((p) => {
            const active = p.id === packageId;
            const features = lang === "hi" && p.featuresHi.length ? p.featuresHi : p.featuresEn;
            return (
              <label
                key={p.id}
                className={cn(
                  "relative block cursor-pointer rounded-2xl border-2 p-4 transition",
                  active
                    ? "border-saffron-600 bg-saffron-50 shadow-soft"
                    : "border-saffron-100 bg-white hover:border-saffron-300",
                )}
              >
                <input
                  type="radio"
                  name="packageId"
                  value={p.id}
                  checked={active}
                  onChange={() => {
                    setPackageId(p.id);
                    setMembers([]);
                  }}
                  className="sr-only"
                />

                {p.isPopular && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-maroon-900">
                    {t.common.popular}
                  </span>
                )}

                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition",
                      active ? "border-saffron-600 bg-saffron-600" : "border-saffron-300 bg-white",
                    )}
                    aria-hidden="true"
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-[15px] font-bold text-maroon-800">
                        {pick(lang, p.nameEn, p.nameHi)}
                      </p>
                      <p className="flex items-baseline gap-2">
                        <span className="font-display text-lg font-bold text-saffron-700">
                          {formatINR(p.priceInPaise)}
                        </span>
                        {p.mrpInPaise && p.mrpInPaise > p.priceInPaise && (
                          <span className="text-xs text-ink/40 line-through">
                            {formatINR(p.mrpInPaise)}
                          </span>
                        )}
                      </p>
                    </div>

                    <p className="mt-0.5 text-[11.5px] font-semibold text-ink/50">
                      {t.common.upto} {p.maxMembers} {t.common.members}
                    </p>

                    {active && (
                      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                        {features.map((f) => (
                          <li key={f} className="flex gap-1.5 text-[12px] leading-snug text-ink/65">
                            <span className="mt-[2px] text-saffron-600">✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* ---------- Devotee details ---------- */}
      <div>
        <h3 className="text-lg">{t.booking.title}</h3>
        <p className="mt-1 text-[13px] text-ink/55">{t.booking.subtitle}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="devoteeName">
              {t.booking.name} <span className="text-maroon-600">*</span>
            </label>
            <input
              id="devoteeName"
              name="devoteeName"
              required
              maxLength={120}
              autoComplete="name"
              placeholder={t.booking.namePh}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="gotra">
              {t.booking.gotra} <span className="text-maroon-600">*</span>
            </label>
            <input
              id="gotra"
              name="gotra"
              required
              maxLength={80}
              placeholder={t.booking.gotraPh}
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="phone">
              {t.booking.phone} <span className="text-maroon-600">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              inputMode="numeric"
              maxLength={15}
              autoComplete="tel"
              placeholder={t.booking.phonePh}
              className="input"
            />
            <p className="mt-1.5 text-[12px] text-ink/50">{t.booking.phoneHelp}</p>
          </div>

          <div>
            <label className="label" htmlFor="email">
              {t.booking.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              maxLength={200}
              autoComplete="email"
              placeholder="name@example.com"
              className="input"
            />
          </div>
        </div>

        {extraSlots > 0 && (
          <div className="mt-5">
            <p className="label">{t.booking.members}</p>
            <p className="-mt-1 mb-2 text-[12px] text-ink/50">{t.booking.membersHelp}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: extraSlots }, (_, i) => (
                <input
                  key={i}
                  value={members[i] ?? ""}
                  onChange={(e) => {
                    const next = [...members];
                    next[i] = e.target.value;
                    setMembers(next);
                  }}
                  maxLength={120}
                  placeholder={`${lang === "hi" ? "सदस्य" : "Member"} ${i + 2}`}
                  className="input"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <label className="label" htmlFor="sankalp">
            {t.booking.sankalp}
          </label>
          <textarea
            id="sankalp"
            name="sankalp"
            rows={3}
            maxLength={500}
            placeholder={t.booking.sankalpPh}
            className="input resize-y"
          />
        </div>
      </div>

      {/* ---------- Address ---------- */}
      <div className="rounded-2xl border border-saffron-100 bg-saffron-50/40 p-5">
        <button
          type="button"
          onClick={() => setShowAddress((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span>
            <span className="block text-sm font-bold text-maroon-800">
              {t.booking.address}
            </span>
            <span className="block text-[12px] text-ink/55">
              {lang === "hi"
                ? "प्रसाद घर मंगवाने के लिए भरें (वैकल्पिक)"
                : "Fill this to receive prasad at home (optional)"}
            </span>
          </span>
          <span className={cn("text-saffron-700 transition-transform", showAddress && "rotate-180")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>

        {showAddress && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="addressLine">
                {t.booking.addressLine}
              </label>
              <input id="addressLine" name="addressLine" maxLength={300} className="input" autoComplete="street-address" />
            </div>
            <div>
              <label className="label" htmlFor="city">{t.booking.city}</label>
              <input id="city" name="city" maxLength={120} className="input" autoComplete="address-level2" />
            </div>
            <div>
              <label className="label" htmlFor="state">{t.booking.state}</label>
              <input id="state" name="state" maxLength={120} className="input" autoComplete="address-level1" />
            </div>
            <div>
              <label className="label" htmlFor="pincode">{t.booking.pincode}</label>
              <input id="pincode" name="pincode" inputMode="numeric" maxLength={6} className="input" autoComplete="postal-code" />
            </div>
          </div>
        )}
      </div>

      {/* ---------- Summary + submit ---------- */}
      <div className="rounded-2xl border-2 border-saffron-200 bg-white p-5">
        <h3 className="text-base">{t.booking.summary}</h3>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink/60">{lang === "hi" ? "पूजा" : "Puja"}</dt>
            <dd className="text-right font-semibold text-maroon-800">{pujaTitle}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink/60">{lang === "hi" ? "पैकेज" : "Package"}</dt>
            <dd className="font-semibold text-maroon-800">
              {pick(lang, selected.nameEn, selected.nameHi)}
            </dd>
          </div>
          <div className="mt-3 flex justify-between gap-4 border-t border-saffron-100 pt-3">
            <dt className="font-bold text-maroon-800">{t.booking.total}</dt>
            <dd className="font-display text-xl font-bold text-saffron-700">
              {formatINR(selected.priceInPaise)}
            </dd>
          </div>
        </dl>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px] text-ink/70">
          <input
            type="checkbox"
            name="whatsappOptIn"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-saffron-300 accent-saffron-600"
          />
          <span>{t.booking.optIn}</span>
        </label>

        {!paymentLive && (
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            ⚠️ {t.booking.demoMode}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-800"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full py-3 text-[15px]">
          {busy ? t.common.loading : `${t.cta.proceed} • ${formatINR(selected.priceInPaise)}`}
        </button>

        <p className="mt-3 text-center text-[11.5px] text-ink/50">🔒 {t.booking.securePay}</p>
      </div>
    </form>
  );
}
