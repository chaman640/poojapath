"use client";

import { useMemo, useState } from "react";

export type TempleOption = {
  nameEn: string;
  nameHi: string;
  cityEn: string;
  cityHi: string;
  stateEn: string;
  stateHi: string;
};

/**
 * Mandir ka naam — list se chun sakte hain YA naya type kar sakte hain.
 * Purana mandir chunte hi city/state apne aap bhar jate hain.
 * Naya naam likha to save karte waqt naya mandir apne aap ban jata hai.
 */
export default function TempleField({
  temples,
  initial,
}: {
  temples: TempleOption[];
  initial: TempleOption;
}) {
  const [value, setValue] = useState(initial);

  const byName = useMemo(() => {
    const map = new Map<string, TempleOption>();
    for (const t of temples) map.set(t.nameEn.trim().toLowerCase(), t);
    return map;
  }, [temples]);

  const matched = byName.get(value.nameEn.trim().toLowerCase());
  const isNew = value.nameEn.trim().length > 0 && !matched;

  function onNameChange(nameEn: string) {
    const hit = byName.get(nameEn.trim().toLowerCase());
    if (hit) {
      setValue({ ...hit });
    } else {
      setValue((v) => ({ ...v, nameEn }));
    }
  }

  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="label mb-0">Mandir / Tirth kshetra</span>
        {matched && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">
            ✓ Pehle se hai
          </span>
        )}
        {isNew && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
            + Naya mandir banega
          </span>
        )}
      </div>

      <p className="-mt-1 mb-2 text-[11.5px] text-ink/45">
        List me se chunein ya seedha naya naam type kar dein — naya mandir apne aap
        ban jayega.
      </p>

      <input
        name="templeName"
        list="temple-options"
        value={value.nameEn}
        onChange={(e) => onNameChange(e.target.value)}
        maxLength={200}
        placeholder="Jaise: Shri Kashi Vishwanath Dham"
        className="input"
        autoComplete="off"
      />

      <datalist id="temple-options">
        {temples.map((t) => (
          <option key={t.nameEn} value={t.nameEn}>
            {t.cityEn}, {t.stateEn}
          </option>
        ))}
      </datalist>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="label">Mandir ka naam (Hindi)</span>
          <input
            name="templeNameHi"
            value={value.nameHi}
            onChange={(e) => setValue({ ...value, nameHi: e.target.value })}
            maxLength={200}
            placeholder="जैसे: श्री काशी विश्वनाथ धाम"
            className="input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="label">Sheher</span>
            <input
              name="templeCity"
              value={value.cityEn}
              onChange={(e) => setValue({ ...value, cityEn: e.target.value })}
              maxLength={120}
              placeholder="Varanasi"
              className="input"
            />
          </div>
          <div>
            <span className="label">Rajya</span>
            <input
              name="templeState"
              value={value.stateEn}
              onChange={(e) => setValue({ ...value, stateEn: e.target.value })}
              maxLength={120}
              placeholder="Uttar Pradesh"
              className="input"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          <div>
            <span className="label">Sheher (Hindi)</span>
            <input
              name="templeCityHi"
              value={value.cityHi}
              onChange={(e) => setValue({ ...value, cityHi: e.target.value })}
              maxLength={120}
              placeholder="वाराणसी"
              className="input"
            />
          </div>
          <div>
            <span className="label">Rajya (Hindi)</span>
            <input
              name="templeStateHi"
              value={value.stateHi}
              onChange={(e) => setValue({ ...value, stateHi: e.target.value })}
              maxLength={120}
              placeholder="उत्तर प्रदेश"
              className="input"
            />
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11.5px] text-ink/45">
        Mandir na daalna ho to naam khaali chhod dein.
      </p>
    </div>
  );
}
