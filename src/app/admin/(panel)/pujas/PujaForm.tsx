"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { savePujaAction, type ActionState } from "../../actions";
import { ART_KEYS } from "@/components/SacredArt";
import ImageUploader from "@/components/admin/ImageUploader";
import { formatINR, optimizedImage } from "@/lib/utils";

export type AddonOption = {
  id: string;
  nameEn: string;
  nameHi: string;
  priceInPaise: number;
  imageUrl: string | null;
  kind: "DELIVERY" | "SERVICE";
};

export type PkgInput = {
  id?: string;
  nameEn: string;
  nameHi: string;
  price: number;
  mrp: number | null;
  maxMembers: number;
  featuresEn: string;
  featuresHi: string;
  isPopular: boolean;
};

export type PujaFormValues = {
  id?: string;
  slug: string;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  benefitsEn: string;
  benefitsHi: string;
  ritualsEn: string;
  ritualsHi: string;
  artKey: string;
  imageUrl: string;
  addonIds: string[];
  pujaDate: string;
  templeId: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  seatsTotal: string;
  order: number;
  packages: PkgInput[];
};

const EMPTY_PKG: PkgInput = {
  nameEn: "",
  nameHi: "",
  price: 1100,
  mrp: null,
  maxMembers: 1,
  featuresEn: "",
  featuresHi: "",
  isPopular: false,
};

function Submit({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary px-7 py-2.5">
      {pending ? "Saving…" : isEdit ? "Changes save karein" : "Puja publish karein"}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      {hint && <p className="-mt-1 mb-1.5 text-[11.5px] text-ink/45">{hint}</p>}
      {children}
    </div>
  );
}

export default function PujaForm({
  initial,
  temples,
  categories,
  allAddons,
}: {
  initial: PujaFormValues;
  temples: Array<{ id: string; nameEn: string; cityEn: string }>;
  categories: Array<{ id: string; nameEn: string }>;
  allAddons: AddonOption[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(savePujaAction, {});
  const [pkgs, setPkgs] = useState<PkgInput[]>(
    initial.packages.length ? initial.packages : [{ ...EMPTY_PKG, nameEn: "Individual", nameHi: "एकल" }],
  );
  const [pickedAddons, setPickedAddons] = useState<string[]>(initial.addonIds);

  const isEdit = Boolean(initial.id);

  return (
    <form action={formAction} className="space-y-6">
      {initial.id && <input type="hidden" name="pujaId" value={initial.id} />}

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13.5px] text-red-800"
        >
          {state.error}
        </p>
      )}

      {/* ---------------- Basic ---------------- */}
      {/* ---------------- Photo ---------------- */}
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg">Puja ki photo</h2>
        <p className="mt-1 text-[12.5px] text-ink/50">
          Mandir ya puja ki asli photo daalein — card aur puja page dono par dikhegi.
        </p>
        <div className="mt-4 max-w-md">
          <ImageUploader
            name="imageUrl"
            initialUrl={initial.imageUrl}
            folder="pujas"
            label=""
          />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg">Basic details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Title (English) *">
            <input name="titleEn" required maxLength={250} defaultValue={initial.titleEn} className="input" />
          </Field>
          <Field label="Title (Hindi) *">
            <input name="titleHi" required maxLength={250} defaultValue={initial.titleHi} className="input" />
          </Field>

          <Field label="URL slug *" hint="Sirf chhote letters, number aur hyphen. Jaise: kaal-sarp-dosh-puja">
            <input
              name="slug"
              required
              pattern="[a-z0-9-]+"
              maxLength={200}
              defaultValue={initial.slug}
              className="input font-mono text-[13px]"
            />
          </Field>
          <Field label="Puja date & time *">
            <input
              name="pujaDate"
              type="datetime-local"
              required
              defaultValue={initial.pujaDate}
              className="input"
            />
          </Field>

          <Field label="Subtitle (English)" hint="Ek line me laabh — card par dikhta hai">
            <input name="subtitleEn" maxLength={300} defaultValue={initial.subtitleEn} className="input" />
          </Field>
          <Field label="Subtitle (Hindi)">
            <input name="subtitleHi" maxLength={300} defaultValue={initial.subtitleHi} className="input" />
          </Field>

          <Field label="Temple">
            <select name="templeId" defaultValue={initial.templeId} className="input">
              <option value="">— koi nahi —</option>
              {temples.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameEn} ({t.cityEn})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select name="categoryId" defaultValue={initial.categoryId} className="input">
              <option value="">— koi nahi —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Artwork" hint="Card par kaunsa chinh dikhega">
            <select name="artKey" defaultValue={initial.artKey} className="input">
              {ART_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total seats" hint="Khaali chhod dein to unlimited">
            <input
              name="seatsTotal"
              type="number"
              min={0}
              max={100000}
              defaultValue={initial.seatsTotal}
              className="input"
            />
          </Field>

          <Field label="Sort order" hint="Chhota number pehle dikhega">
            <input name="order" type="number" min={0} max={9999} defaultValue={initial.order} className="input" />
          </Field>

          <div className="flex items-end gap-6 pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold text-maroon-800">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={initial.isActive}
                className="h-4 w-4 accent-saffron-600"
              />
              Live (site par dikhe)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold text-maroon-800">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={initial.isFeatured}
                className="h-4 w-4 accent-saffron-600"
              />
              Featured
            </label>
          </div>
        </div>
      </section>

      {/* ---------------- Content ---------------- */}
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg">Content</h2>
        <p className="mt-1 text-[12.5px] text-ink/50">
          Benefits aur rituals me har line ek point banti hai — Enter dabakar nayi line likhein.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Description (English)">
            <textarea name="descriptionEn" rows={7} maxLength={6000} defaultValue={initial.descriptionEn} className="input resize-y" />
          </Field>
          <Field label="Description (Hindi)">
            <textarea name="descriptionHi" rows={7} maxLength={6000} defaultValue={initial.descriptionHi} className="input resize-y" />
          </Field>

          <Field label="Benefits (English)" hint="Ek line = ek benefit">
            <textarea name="benefitsEn" rows={5} defaultValue={initial.benefitsEn} className="input resize-y" />
          </Field>
          <Field label="Benefits (Hindi)">
            <textarea name="benefitsHi" rows={5} defaultValue={initial.benefitsHi} className="input resize-y" />
          </Field>

          <Field label="Rituals / vidhi (English)" hint="Ek line = ek step">
            <textarea name="ritualsEn" rows={5} defaultValue={initial.ritualsEn} className="input resize-y" />
          </Field>
          <Field label="Rituals / vidhi (Hindi)">
            <textarea name="ritualsHi" rows={5} defaultValue={initial.ritualsHi} className="input resize-y" />
          </Field>
        </div>
      </section>

      {/* ---------------- Packages ---------------- */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg">Packages & pricing</h2>
            <p className="mt-1 text-[12.5px] text-ink/50">Kam se kam 1, zyada se zyada 6.</p>
          </div>
          {pkgs.length < 6 && (
            <button
              type="button"
              onClick={() => setPkgs([...pkgs, { ...EMPTY_PKG }])}
              className="btn-secondary px-4 py-2 text-[13px]"
            >
              + Package add karein
            </button>
          )}
        </div>

        <div className="mt-5 space-y-5">
          {pkgs.map((p, i) => (
            <div key={i} className="rounded-2xl border border-saffron-200 bg-saffron-50/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] font-bold uppercase tracking-wide text-saffron-700">
                  Package {i + 1}
                </p>
                {pkgs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPkgs(pkgs.filter((_, idx) => idx !== i))}
                    className="text-[12.5px] font-semibold text-red-600 hover:underline"
                  >
                    Hataayein
                  </button>
                )}
              </div>

              {p.id && <input type="hidden" name={`pkg_${i}_id`} value={p.id} />}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Name (English) *">
                  <input name={`pkg_${i}_nameEn`} required defaultValue={p.nameEn} maxLength={160} className="input py-2" />
                </Field>
                <Field label="Name (Hindi)">
                  <input name={`pkg_${i}_nameHi`} defaultValue={p.nameHi} maxLength={160} className="input py-2" />
                </Field>
                <Field label="Price (₹) *">
                  <input
                    name={`pkg_${i}_price`}
                    type="number"
                    min={1}
                    step="1"
                    required
                    defaultValue={p.price}
                    className="input py-2"
                  />
                </Field>
                <Field label="MRP (₹)" hint="Cut price — khaali chhod sakte hain">
                  <input
                    name={`pkg_${i}_mrp`}
                    type="number"
                    min={0}
                    step="1"
                    defaultValue={p.mrp ?? ""}
                    className="input py-2"
                  />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Max members">
                  <input
                    name={`pkg_${i}_maxMembers`}
                    type="number"
                    min={1}
                    max={50}
                    defaultValue={p.maxMembers}
                    className="input py-2"
                  />
                </Field>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-maroon-800">
                    <input
                      type="checkbox"
                      name={`pkg_${i}_isPopular`}
                      defaultChecked={p.isPopular}
                      className="h-4 w-4 accent-saffron-600"
                    />
                    “Most Popular” tag lagayein
                  </label>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Features (English)" hint="Ek line = ek feature">
                  <textarea
                    name={`pkg_${i}_featuresEn`}
                    rows={4}
                    defaultValue={p.featuresEn}
                    className="input resize-y py-2"
                  />
                </Field>
                <Field label="Features (Hindi)">
                  <textarea
                    name={`pkg_${i}_featuresHi`}
                    rows={4}
                    defaultValue={p.featuresHi}
                    className="input resize-y py-2"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Add-ons ---------------- */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg">Is puja me kaunse add-ons dikhein</h2>
            <p className="mt-1 text-[12.5px] text-ink/50">
              Booking ke waqt user inhe jod sakega. Tick karke chunein.
            </p>
          </div>
          <Link href="/admin/addons/new" target="_blank" className="btn-secondary px-4 py-2 text-[13px]">
            + Naya add-on banayein
          </Link>
        </div>

        {allAddons.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-saffron-200 bg-saffron-50/50 p-5 text-center text-[13.5px] text-ink/55">
            Abhi koi add-on nahi bana. Pehle{" "}
            <Link href="/admin/addons/new" className="font-semibold text-saffron-700 underline">
              Add-ons
            </Link>{" "}
            me jaakar banayein — jaise “Prasad ghar par”, “Rudraksh mala”.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {allAddons.map((a) => {
              const checked = pickedAddons.includes(a.id);
              return (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${
                    checked
                      ? "border-saffron-600 bg-saffron-50"
                      : "border-saffron-100 bg-white hover:border-saffron-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="addonIds"
                    value={a.id}
                    checked={checked}
                    onChange={(e) =>
                      setPickedAddons((prev) =>
                        e.target.checked
                          ? [...prev, a.id]
                          : prev.filter((id) => id !== a.id),
                      )
                    }
                    className="h-5 w-5 shrink-0 accent-saffron-600"
                  />

                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-saffron-100">
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={optimizedImage(a.imageUrl, 120) ?? ""}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-lg">
                        {a.kind === "DELIVERY" ? "📦" : "🛕"}
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-maroon-800">
                      {a.nameEn}
                    </span>
                    <span className="block text-[12px] text-ink/55">
                      {formatINR(a.priceInPaise)} •{" "}
                      {a.kind === "DELIVERY" ? "ghar bhejna" : "mandir seva"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Submit isEdit={isEdit} />
        <Link href="/admin/pujas" className="btn-secondary px-5 py-2.5">
          Cancel
        </Link>
      </div>
    </form>
  );
}
