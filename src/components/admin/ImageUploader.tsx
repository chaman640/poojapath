"use client";

import { useRef, useState } from "react";

/**
 * Photo upload — file chuno, apne aap Cloudinary par chali jaati hai.
 * Hidden input me URL rehta hai jo form ke saath submit hota hai.
 */
export default function ImageUploader({
  name,
  initialUrl,
  folder = "pujas",
  label = "Photo",
  hint = "JPG / PNG / WebP • 5 MB tak",
  aspect = "aspect-[16/10]",
}: {
  name: string;
  initialUrl?: string | null;
  folder?: string;
  label?: string;
  hint?: string;
  aspect?: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showLink, setShowLink] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo 5 MB se chhoti honi chahiye.");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (res.ok && data.ok) {
        setUrl(data.url);
      } else {
        setError(data.error || "Upload nahi ho paya.");
      }
    } catch {
      setError("Network problem. Dobara koshish karein.");
    }
    setBusy(false);
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={url} />

      <div
        className={`relative ${aspect} w-full overflow-hidden rounded-2xl border-2 border-dashed border-saffron-200 bg-saffron-50/50`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
            <span className="text-3xl">📷</span>
            <span className="text-[13px] font-semibold text-ink/60">
              Abhi koi photo nahi
            </span>
            <span className="text-[11.5px] text-ink/40">{hint}</span>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-white/80">
            <span className="text-[13px] font-bold text-saffron-700">
              Upload ho rahi hai…
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn-secondary px-4 py-2 text-[13px]"
        >
          {url ? "Photo badlein" : "Photo chunein"}
        </button>

        {url && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="btn-ghost px-3 py-2 text-[13px] text-red-600"
          >
            Hataayein
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowLink((v) => !v)}
          className="btn-ghost px-3 py-2 text-[13px]"
        >
          {showLink ? "Link band karein" : "Ya link paste karein"}
        </button>
      </div>

      {showLink && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… (photo ka seedha link)"
          className="input mt-2 text-[13px]"
        />
      )}

      {error && (
        <p className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[12.5px] text-red-800">
          {error}
        </p>
      )}

      <p className="mt-2 text-[11.5px] text-ink/45">
        Photo na dalein to site apne aap sundar SVG artwork dikha degi.
      </p>
    </div>
  );
}
