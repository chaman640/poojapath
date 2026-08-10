"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./LanguageProvider";

export default function TrackForm() {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: String(fd.get("bookingCode") ?? ""),
          phone: String(fd.get("phone") ?? ""),
        }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        router.push(`/booking/${encodeURIComponent(data.bookingCode)}`);
        return;
      }

      setError(data.error === "not_found" ? t.track.notFound : data.error || t.track.notFound);
    } catch {
      setError("Network problem. Dobara koshish karein.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md p-6 sm:p-8">
      <div>
        <label className="label" htmlFor="bookingCode">
          {t.track.code}
        </label>
        <input
          id="bookingCode"
          name="bookingCode"
          required
          maxLength={40}
          placeholder={t.track.codePh}
          className="input font-mono uppercase tracking-wider"
        />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="phone">
          {t.track.phone}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          inputMode="numeric"
          maxLength={15}
          placeholder={t.booking.phonePh}
          className="input"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-800"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary mt-6 w-full py-3">
        {busy ? t.common.loading : t.cta.trackBooking}
      </button>
    </form>
  );
}
