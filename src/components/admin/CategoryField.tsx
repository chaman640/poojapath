"use client";

import { useMemo, useState } from "react";

export type CategoryOption = { nameEn: string; nameHi: string };

/**
 * Puja ka type / category — list se chunein ya naya type kar dein.
 * Naya naam likhne par nayi category apne aap ban jayegi.
 */
export default function CategoryField({
  categories,
  initial,
}: {
  categories: CategoryOption[];
  initial: CategoryOption;
}) {
  const [value, setValue] = useState(initial);

  const byName = useMemo(() => {
    const map = new Map<string, CategoryOption>();
    for (const c of categories) map.set(c.nameEn.trim().toLowerCase(), c);
    return map;
  }, [categories]);

  const matched = byName.get(value.nameEn.trim().toLowerCase());
  const isNew = value.nameEn.trim().length > 0 && !matched;

  function onNameChange(nameEn: string) {
    const hit = byName.get(nameEn.trim().toLowerCase());
    setValue(hit ? { ...hit } : { ...value, nameEn });
  }

  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="label mb-0">Puja ka type (category)</span>
        {matched && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">
            ✓ Pehle se hai
          </span>
        )}
        {isNew && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
            + Naya type banega
          </span>
        )}
      </div>

      <p className="-mt-1 mb-2 text-[11.5px] text-ink/45">
        Jaise: Dosh Nivaran, Shiv Puja, Grah Shanti. List me na ho to naya type kar dein.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input
            name="categoryName"
            list="category-options"
            value={value.nameEn}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={160}
            placeholder="Jaise: Grah Shanti"
            className="input"
            autoComplete="off"
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c.nameEn} value={c.nameEn}>
                {c.nameHi}
              </option>
            ))}
          </datalist>
        </div>

        <div>
          <input
            name="categoryNameHi"
            value={value.nameHi}
            onChange={(e) => setValue({ ...value, nameHi: e.target.value })}
            maxLength={160}
            placeholder="हिंदी में (जैसे: ग्रह शांति)"
            className="input"
          />
        </div>
      </div>

      <p className="mt-2 text-[11.5px] text-ink/45">
        Category na chahiye to khaali chhod dein.
      </p>
    </div>
  );
}
