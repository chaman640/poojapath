"use client";

import { useState } from "react";
import { useLang } from "./LanguageProvider";

export default function ContactForm() {
  const { lang, t } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          email: String(fd.get("email") ?? ""),
          subject: String(fd.get("subject") ?? ""),
          message: String(fd.get("message") ?? ""),
          website: String(fd.get("website") ?? ""),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDone(true);
      } else {
        setError(data.error || "Message nahi bheja ja saka.");
      }
    } catch {
      setError("Network problem. Dobara koshish karein.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <span className="text-4xl">🙏</span>
        <h3 className="mt-3 text-xl">
          {lang === "hi" ? "धन्यवाद!" : "Thank you!"}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
          {lang === "hi"
            ? "आपका संदेश हमें मिल गया है। हम 24 घंटे के भीतर आपके नंबर पर संपर्क करेंगे।"
            : "We have received your message. Our team will contact you on your number within 24 hours."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-8">
      {/* honeypot — insaan ise nahi dekhega */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">
            {t.booking.name} <span className="text-maroon-600">*</span>
          </label>
          <input id="c-name" name="name" required maxLength={120} className="input" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="c-phone">
            {t.booking.phone} <span className="text-maroon-600">*</span>
          </label>
          <input id="c-phone" name="phone" type="tel" required maxLength={15} inputMode="numeric" className="input" autoComplete="tel" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="c-email">{t.booking.email}</label>
          <input id="c-email" name="email" type="email" maxLength={200} className="input" autoComplete="email" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="c-subject">
            {lang === "hi" ? "विषय" : "Subject"} <span className="text-maroon-600">*</span>
          </label>
          <input
            id="c-subject"
            name="subject"
            required
            maxLength={200}
            className="input"
            placeholder={lang === "hi" ? "जैसे: पूजा बुकिंग में सहायता" : "e.g. Help with a puja booking"}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="c-message">
            {lang === "hi" ? "संदेश" : "Message"} <span className="text-maroon-600">*</span>
          </label>
          <textarea id="c-message" name="message" required rows={5} maxLength={2000} className="input resize-y" />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary mt-6 w-full py-3">
        {busy ? t.common.loading : t.cta.submit}
      </button>
    </form>
  );
}
