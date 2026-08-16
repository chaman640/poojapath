"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./LanguageProvider";
import { pick } from "@/lib/i18n";
import { cn, formatINR, optimizedImage } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type WizardPackage = {
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

export type WizardAddon = {
  id: string;
  nameEn: string;
  nameHi: string;
  descEn: string;
  descHi: string;
  priceInPaise: number;
  imageUrl: string | null;
  artKey: string;
  kind: "DELIVERY" | "SERVICE";
};

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i < current ? "w-6 bg-saffron-600" : i === current ? "w-8 bg-saffron-600" : "w-4 bg-saffron-200",
          )}
        />
      ))}
    </div>
  );
}

function AddonThumb({ addon }: { addon: WizardAddon }) {
  const src = optimizedImage(addon.imageUrl, 200);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
    );
  }
  return (
    <span className="grid h-full w-full place-items-center bg-saffron-100 text-2xl">
      {addon.kind === "DELIVERY" ? "📦" : "🪔"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Wizard                                                             */
/* ------------------------------------------------------------------ */

export default function BookingWizard({
  pujaSlug,
  pujaTitle,
  packages,
  addons,
  paymentLive,
}: {
  pujaSlug: string;
  pujaTitle: string;
  packages: WizardPackage[];
  addons: WizardAddon[];
  paymentLive: boolean;
}) {
  const { lang, t } = useLang();
  const brandName = t.brand;
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);

  const hasAddons = addons.length > 0;
  const steps = hasAddons ? 4 : 3;

  const [step, setStep] = useState(0);
  const [packageId, setPackageId] = useState(
    packages.find((p) => p.isPopular)?.id ?? packages[0]?.id ?? "",
  );
  const [picked, setPicked] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [form, setForm] = useState({
    devoteeName: "",
    gotra: "",
    phone: "",
    email: "",
    sankalp: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    whatsappOptIn: true,
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId) ?? packages[0],
    [packageId, packages],
  );
  const selectedAddons = useMemo(
    () => addons.filter((a) => picked.includes(a.id)),
    [addons, picked],
  );

  const addonsTotal = selectedAddons.reduce((s, a) => s + a.priceInPaise, 0);
  const total = (selectedPackage?.priceInPaise ?? 0) + addonsTotal;
  const needsAddress = selectedAddons.some((a) => a.kind === "DELIVERY");
  const extraSlots = Math.max((selectedPackage?.maxMembers ?? 1) - 1, 0);

  // step index → kaunsa screen
  const screens = hasAddons
    ? (["package", "addons", "details", "review"] as const)
    : (["package", "details", "review"] as const);
  const screen = screens[step];

  function go(next: number) {
    setError("");
    setStep(Math.max(0, Math.min(next, steps - 1)));
    // upar scroll — mobile par zaroori
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function validateDetails(): boolean {
    if (form.devoteeName.trim().length < 2) {
      setError(lang === "hi" ? "अपना पूरा नाम लिखें।" : "Please write your full name.");
      return false;
    }
    if (form.gotra.trim().length < 2) {
      setError(
        lang === "hi"
          ? "गोत्र लिखें। पता न हो तो 'कश्यप' लिख दें।"
          : "Please write your gotra. If you don't know it, write 'Kashyap'.",
      );
      return false;
    }
    if (!/^(\+?91[- ]?)?[6-9]\d{9}$/.test(form.phone.trim())) {
      setError(
        lang === "hi"
          ? "10 अंकों का सही मोबाइल नंबर डालें।"
          : "Please enter a valid 10-digit mobile number.",
      );
      return false;
    }
    return true;
  }

  function validateAddress(): boolean {
    if (!needsAddress) return true;
    if (
      form.addressLine.trim().length < 4 ||
      form.city.trim().length < 2 ||
      form.state.trim().length < 2 ||
      !/^\d{6}$/.test(form.pincode.trim())
    ) {
      setError(
        lang === "hi"
          ? "पूरा पता और 6 अंकों का पिनकोड भरें।"
          : "Please fill the full address and a 6-digit pincode.",
      );
      return false;
    }
    return true;
  }

  async function submit() {
    if (busy) return;
    if (!validateDetails() || !validateAddress()) return;

    setError("");
    setBusy(true);

    const payload = {
      pujaSlug,
      packageId,
      devoteeName: form.devoteeName.trim(),
      gotra: form.gotra.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      memberNames: members.map((m) => m.trim()).filter(Boolean),
      addonIds: picked,
      sankalp: form.sankalp.trim(),
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      whatsappOptIn: form.whatsappOptIn,
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

      /**
       * Booking ban gayi. Ab paisa apne alag page par.
       *
       * Yahan payment nahi kholte — pehle `/pay/<code>` par le jate hain.
       * Wo ek asli pata hai, isliye browser kahin bhi atke ya khali ho jaye,
       * grahak Back dabakar wapas wahin aa jata hai aur payment wahin se
       * chalta rehta hai. Form dobara bharne ki zaroorat kabhi nahi padti.
       */
      router.push(`/pay/${data.bookingCode}`);
      return;
    } catch {
      setError(
        lang === "hi" ? "नेटवर्क समस्या। दोबारा कोशिश करें।" : "Network problem. Please try again.",
      );
      setBusy(false);
    }
  }

  function onPrimary() {
    if (screen === "package") return go(step + 1);
    if (screen === "addons") return go(step + 1);
    if (screen === "details") {
      if (!validateDetails()) return;
      return go(step + 1);
    }
    return submit();
  }

  if (!selectedPackage) return null;

  const isLast = screen === "review";

  return (
    <div className="relative" ref={topRef}>
      {/* ---------- Header ---------- */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-saffron-700">
            {t.wizard.step} {step + 1} {t.wizard.of} {steps}
          </p>
          <h2 className="mt-0.5 text-xl leading-tight sm:text-2xl">
            {screen === "package" && t.wizard.s1Title}
            {screen === "addons" && t.wizard.s2Title}
            {screen === "details" && t.wizard.s3Title}
            {screen === "review" && (needsAddress ? t.wizard.s4Title : t.wizard.review)}
          </h2>
        </div>
        <StepDots current={step} total={steps} />
      </div>

      <p className="mb-5 text-[14px] leading-relaxed text-ink/60">
        {screen === "package" && t.wizard.s1Sub}
        {screen === "addons" && t.wizard.s2Sub}
        {screen === "details" && t.wizard.s3Sub}
        {screen === "review" &&
          (needsAddress ? t.wizard.s4Required : t.wizard.reviewSub)}
      </p>

      {/* ---------- Step 1: package ---------- */}
      {screen === "package" && (
        <div className="space-y-3">
          {packages.map((p) => {
            const active = p.id === packageId;
            const features = lang === "hi" && p.featuresHi.length ? p.featuresHi : p.featuresEn;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPackageId(p.id);
                  setMembers([]);
                }}
                className={cn(
                  "relative w-full rounded-2xl border-2 p-4 text-left transition active:scale-[.99]",
                  active
                    ? "border-saffron-600 bg-saffron-50 shadow-soft"
                    : "border-saffron-100 bg-white",
                )}
              >
                {p.isPopular && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-gold-500 px-2.5 py-0.5 text-[10px] font-bold text-maroon-900">
                    ★ {t.common.popular}
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                      active ? "border-saffron-600 bg-saffron-600" : "border-saffron-300",
                    )}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-bold text-maroon-800">
                      {pick(lang, p.nameEn, p.nameHi)}
                    </p>
                    <p className="text-[12.5px] text-ink/55">
                      {p.maxMembers === 1
                        ? lang === "hi"
                          ? "1 व्यक्ति के नाम से"
                          : "For 1 person"
                        : lang === "hi"
                          ? `${p.maxMembers} लोगों तक`
                          : `Up to ${p.maxMembers} people`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-saffron-700">
                      {formatINR(p.priceInPaise)}
                    </p>
                    {p.mrpInPaise && p.mrpInPaise > p.priceInPaise && (
                      <p className="text-[12px] text-ink/40 line-through">
                        {formatINR(p.mrpInPaise)}
                      </p>
                    )}
                  </div>
                </div>

                {active && features.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-saffron-200 pt-3">
                    {features.map((f) => (
                      <li key={f} className="flex gap-2 text-[13px] leading-snug text-ink/70">
                        <span className="text-saffron-600">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ---------- Step 2: add-ons ---------- */}
      {screen === "addons" && (
        <div className="space-y-3">
          {addons.map((a) => {
            const on = picked.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  setPicked((prev) =>
                    prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                  )
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition active:scale-[.99]",
                  on ? "border-saffron-600 bg-saffron-50" : "border-saffron-100 bg-white",
                )}
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <AddonThumb addon={a} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold leading-snug text-maroon-800">
                    {pick(lang, a.nameEn, a.nameHi)}
                  </span>
                  {pick(lang, a.descEn, a.descHi) && (
                    <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-ink/55">
                      {pick(lang, a.descEn, a.descHi)}
                    </span>
                  )}
                  <span className="mt-1 block font-display text-[16px] font-bold text-saffron-700">
                    + {formatINR(a.priceInPaise)}
                  </span>
                  {a.kind === "DELIVERY" && (
                    <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                      📦 {lang === "hi" ? "घर भेजा जाएगा" : "Sent to your home"}
                    </span>
                  )}
                </span>

                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full text-[13px] font-bold transition",
                    on ? "bg-saffron-600 text-white" : "bg-saffron-100 text-saffron-700",
                  )}
                >
                  {on ? "✓" : "+"}
                </span>
              </button>
            );
          })}

          {picked.length === 0 && (
            <p className="pt-2 text-center text-[13px] text-ink/45">{t.wizard.s2None}</p>
          )}
        </div>
      )}

      {/* ---------- Step 3: details ---------- */}
      {screen === "details" && (
        <div className="space-y-5">
          <div>
            <label className="label-lg" htmlFor="w-name">
              {t.booking.name} <span className="text-maroon-600">*</span>
            </label>
            <input
              id="w-name"
              value={form.devoteeName}
              onChange={(e) => setForm({ ...form, devoteeName: e.target.value })}
              maxLength={120}
              autoComplete="name"
              placeholder={t.booking.namePh}
              className="input-lg"
            />
          </div>

          <div>
            <label className="label-lg" htmlFor="w-gotra">
              {t.booking.gotra} <span className="text-maroon-600">*</span>
            </label>
            <input
              id="w-gotra"
              value={form.gotra}
              onChange={(e) => setForm({ ...form, gotra: e.target.value })}
              maxLength={80}
              placeholder={t.booking.gotraPh}
              className="input-lg"
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, gotra: lang === "hi" ? "कश्यप" : "Kashyap" })}
              className="mt-2 rounded-full border border-saffron-300 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-saffron-700"
            >
              {lang === "hi" ? "गोत्र नहीं पता? 'कश्यप' लगाएँ" : "Don't know? Use 'Kashyap'"}
            </button>
          </div>

          <div>
            <label className="label-lg" htmlFor="w-phone">
              {t.booking.phone} <span className="text-maroon-600">*</span>
            </label>
            <input
              id="w-phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              maxLength={15}
              autoComplete="tel"
              placeholder={t.booking.phonePh}
              className="input-lg"
            />
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink/55">
              📲 {t.booking.phoneHelp}
            </p>
          </div>

          {extraSlots > 0 && (
            <div>
              <label className="label-lg">{t.booking.members}</label>
              <p className="-mt-1 mb-2 text-[12.5px] text-ink/50">{t.booking.membersHelp}</p>
              <div className="space-y-2">
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
                    className="input-lg"
                  />
                ))}
              </div>
            </div>
          )}

          <details className="rounded-2xl border border-saffron-100 bg-white p-4">
            <summary className="cursor-pointer text-[14px] font-semibold text-maroon-800">
              {lang === "hi" ? "ईमेल और संकल्प (वैकल्पिक)" : "Email & sankalp (optional)"}
            </summary>
            <div className="mt-4 space-y-4">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={200}
                autoComplete="email"
                placeholder={t.booking.email}
                className="input-lg"
              />
              <textarea
                value={form.sankalp}
                onChange={(e) => setForm({ ...form, sankalp: e.target.value })}
                rows={3}
                maxLength={500}
                placeholder={t.booking.sankalpPh}
                className="input-lg resize-y"
              />
            </div>
          </details>
        </div>
      )}

      {/* ---------- Last step: (address only if needed) + review ---------- */}
      {screen === "review" && (
        <div className="space-y-5">
          {needsAddress && (
          <div className="space-y-4">
            <div>
              <label className="label-lg" htmlFor="w-addr">
                {t.booking.addressLine} <span className="text-maroon-600">*</span>
              </label>
              <input
                id="w-addr"
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                maxLength={300}
                autoComplete="street-address"
                placeholder={lang === "hi" ? "मकान नं., गली, मोहल्ला" : "House no., street, area"}
                className="input-lg"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-lg" htmlFor="w-city">
                  {t.booking.city} <span className="text-maroon-600">*</span>
                </label>
                <input
                  id="w-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  maxLength={120}
                  autoComplete="address-level2"
                  className="input-lg"
                />
              </div>
              <div>
                <label className="label-lg" htmlFor="w-state">
                  {t.booking.state} <span className="text-maroon-600">*</span>
                </label>
                <input
                  id="w-state"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  maxLength={120}
                  autoComplete="address-level1"
                  className="input-lg"
                />
              </div>
            </div>

            <div>
              <label className="label-lg" htmlFor="w-pin">
                {t.booking.pincode} <span className="text-maroon-600">*</span>
              </label>
              <input
                id="w-pin"
                inputMode="numeric"
                value={form.pincode}
                onChange={(e) =>
                  setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })
                }
                maxLength={6}
                autoComplete="postal-code"
                placeholder="226001"
                className="input-lg max-w-[180px]"
              />
            </div>
          </div>
          )}

          {/* Summary */}
          <div className="rounded-2xl border-2 border-saffron-200 bg-white p-4">
            <h3 className="text-[15px]">{t.booking.summary}</h3>

            <dl className="mt-3 space-y-2 text-[14px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink/60">{pick(lang, "Puja", "पूजा")}</dt>
                <dd className="text-right font-semibold text-maroon-800">{pujaTitle}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink/60">
                  {pick(lang, selectedPackage.nameEn, selectedPackage.nameHi)}
                </dt>
                <dd className="font-semibold text-maroon-800">
                  {formatINR(selectedPackage.priceInPaise)}
                </dd>
              </div>

              {selectedAddons.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3">
                  <dt className="text-ink/60">+ {pick(lang, a.nameEn, a.nameHi)}</dt>
                  <dd className="font-semibold text-maroon-800">
                    {formatINR(a.priceInPaise)}
                  </dd>
                </div>
              ))}

              <div className="flex justify-between gap-3 border-t border-saffron-100 pt-2.5">
                <dt className="text-[15px] font-bold text-maroon-800">{t.booking.total}</dt>
                <dd className="font-display text-xl font-bold text-saffron-700">
                  {formatINR(total)}
                </dd>
              </div>
            </dl>

            <div className="mt-3 border-t border-saffron-100 pt-3 text-[13px] text-ink/65">
              <p>
                <span className="text-ink/45">{t.booking.name}:</span>{" "}
                <span className="font-semibold text-maroon-800">{form.devoteeName || "—"}</span>
              </p>
              <p className="mt-0.5">
                <span className="text-ink/45">{t.booking.gotra}:</span>{" "}
                <span className="font-semibold text-maroon-800">{form.gotra || "—"}</span>
              </p>
              <p className="mt-0.5">
                <span className="text-ink/45">{t.booking.phone}:</span>{" "}
                <span className="font-semibold text-maroon-800">{form.phone || "—"}</span>
              </p>
              <button
                type="button"
                onClick={() => go(screens.indexOf("details"))}
                className="mt-2 text-[12.5px] font-bold text-saffron-700 underline"
              >
                {t.wizard.changeSelection}
              </button>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13.5px] text-ink/70">
              <input
                type="checkbox"
                checked={form.whatsappOptIn}
                onChange={(e) => setForm({ ...form, whatsappOptIn: e.target.checked })}
                className="mt-0.5 h-5 w-5 rounded accent-saffron-600"
              />
              <span>{t.booking.optIn}</span>
            </label>
          </div>

          {!paymentLive && (
            <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
              ⚠️ {t.booking.demoMode}
            </p>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-[14px] leading-relaxed text-red-800"
        >
          {error}
        </p>
      )}

      {/* ---------- Bottom bar ---------- */}
      <div className="wizard-bar sticky bottom-0 z-30 -mx-5 mt-6 border-t border-saffron-100 bg-white/95 px-5 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wide text-ink/45">
            {t.wizard.total}
          </span>
          <span className="font-display text-xl font-bold text-maroon-800">
            {formatINR(total)}
            {selectedAddons.length > 0 && (
              <span className="ml-1.5 text-[11px] font-semibold text-saffron-700">
                (
                {lang === "hi"
                  ? selectedAddons.length === 1
                    ? "1 चीज़ जोड़ी"
                    : `${selectedAddons.length} चीज़ें जोड़ीं`
                  : selectedAddons.length === 1
                    ? "1 item added"
                    : `${selectedAddons.length} items added`}
                )
              </span>
            )}
          </span>
        </div>

        <div className="flex gap-2.5">
          {step > 0 && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={busy}
              className="btn-big w-auto shrink-0 border-2 border-saffron-200 bg-white px-5 text-maroon-800"
            >
              ←
            </button>
          )}

          <button
            type="button"
            onClick={onPrimary}
            disabled={busy}
            className="btn-big bg-gradient-to-r from-saffron-600 to-saffron-500 text-white shadow-soft"
          >
            {busy
              ? t.common.loading
              : isLast
                ? `${t.wizard.payNow} • ${formatINR(total)}`
                : t.wizard.next}
            {!busy && !isLast && <span aria-hidden="true">→</span>}
          </button>
        </div>

        {screen === "addons" && picked.length === 0 && (
          <p className="pb-1 pt-2 text-center text-[12px] text-ink/45">{t.wizard.skip}</p>
        )}
        {isLast && (
          <p className="pb-1 pt-2 text-center text-[11.5px] text-ink/50">
            🔒 {t.booking.securePay}
          </p>
        )}
      </div>
    </div>
  );
}
