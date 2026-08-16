"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { saveAddonAction, type ActionState } from "../../actions";
import ImageUploader from "@/components/admin/ImageUploader";
import { ART_KEYS } from "@/components/SacredArt";

export type AddonFormValues = {
  id?: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  descEn: string;
  descHi: string;
  price: number;
  imageUrl: string;
  artKey: string;
  kind: "DELIVERY" | "SERVICE";
  isActive: boolean;
  order: number;
};

function Submit({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary px-7 py-3">
      {pending ? "Saving…" : isEdit ? "Changes save karein" : "Add-on banayein"}
    </button>
  );
}

export default function AddonForm({ initial }: { initial: AddonFormValues }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveAddonAction, {});
  const [kind, setKind] = useState<"DELIVERY" | "SERVICE">(initial.kind);

  return (
    <form action={formAction} className="space-y-6">
      {initial.id && <input type="hidden" name="addonId" value={initial.id} />}

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13.5px] text-red-800"
        >
          {state.error}
        </p>
      )}

      <section className="card p-5 sm:p-6">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <ImageUploader
            name="imageUrl"
            initialUrl={initial.imageUrl}
            folder="addons"
            label="Add-on ki photo"
            aspect="aspect-square"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label">Naam (English) *</span>
              <input name="nameEn" required maxLength={200} defaultValue={initial.nameEn} className="input" />
            </div>
            <div>
              <span className="label">Naam (Hindi) *</span>
              <input name="nameHi" required maxLength={200} defaultValue={initial.nameHi} className="input" />
            </div>

            <div>
              <span className="label">Slug *</span>
              <p className="-mt-1 mb-1.5 text-[11.5px] text-ink/45">
                jaise: prasad-ghar-par, rudraksh-mala
              </p>
              <input
                name="slug"
                required
                pattern="[a-z0-9-]+"
                maxLength={160}
                defaultValue={initial.slug}
                className="input font-mono text-[13px]"
              />
            </div>
            <div>
              <span className="label">Keemat (₹) *</span>
              <input
                name="price"
                type="number"
                min={0}
                step="1"
                required
                defaultValue={initial.price}
                className="input"
              />
            </div>

            <div className="sm:col-span-2">
              <span className="label">Prakaar *</span>
              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    {
                      value: "DELIVERY" as const,
                      title: "Ghar bhejna hai",
                      desc: "Prasad, mala, samagri — user ko pata bharna zaroori hoga",
                      icon: "📦",
                    },
                    {
                      value: "SERVICE" as const,
                      title: "Mandir me hi seva",
                      desc: "Deepdaan, annadaan, chunri — pata nahi chahiye",
                      icon: "🛕",
                    },
                  ]
                ).map((o) => (
                  <label
                    key={o.value}
                    className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                      kind === o.value
                        ? "border-saffron-600 bg-saffron-50"
                        : "border-saffron-100 bg-white hover:border-saffron-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={o.value}
                      checked={kind === o.value}
                      onChange={() => setKind(o.value)}
                      className="sr-only"
                    />
                    <p className="text-[13.5px] font-bold text-maroon-800">
                      {o.icon} {o.title}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-ink/55">{o.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="label">Artwork (photo na ho to)</span>
              <select name="artKey" defaultValue={initial.artKey} className="input">
                {ART_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Sort order</span>
              <input
                name="order"
                type="number"
                min={0}
                max={9999}
                defaultValue={initial.order}
                className="input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold text-maroon-800">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={initial.isActive}
                  className="h-4 w-4 accent-saffron-600"
                />
                Live (booking me dikhe)
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="label">Description (English)</span>
            <textarea
              name="descEn"
              rows={3}
              maxLength={600}
              defaultValue={initial.descEn}
              className="input resize-y"
            />
          </div>
          <div>
            <span className="label">Description (Hindi)</span>
            <textarea
              name="descHi"
              rows={3}
              maxLength={600}
              defaultValue={initial.descHi}
              className="input resize-y"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Submit isEdit={Boolean(initial.id)} />
        <Link href="/admin/addons" className="btn-secondary px-5 py-3">
          Cancel
        </Link>
      </div>
    </form>
  );
}
