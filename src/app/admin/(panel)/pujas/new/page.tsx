import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addons, categories, temples } from "@/db/schema";
import PujaForm, { type PujaFormValues } from "../PujaForm";

export const dynamic = "force-dynamic";

function defaultDateTimeLocal() {
  const d = new Date(Date.now() + 7 * 86_400_000);
  d.setHours(8, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function NewPujaPage() {
  const [templeList, categoryList, addonList] = await Promise.all([
    db
      .select({
        nameEn: temples.nameEn,
        nameHi: temples.nameHi,
        cityEn: temples.cityEn,
        cityHi: temples.cityHi,
        stateEn: temples.stateEn,
        stateHi: temples.stateHi,
      })
      .from(temples)
      .orderBy(asc(temples.nameEn)),
    db
      .select({ nameEn: categories.nameEn, nameHi: categories.nameHi })
      .from(categories)
      .orderBy(asc(categories.order)),
    db
      .select({
        id: addons.id,
        nameEn: addons.nameEn,
        nameHi: addons.nameHi,
        priceInPaise: addons.priceInPaise,
        imageUrl: addons.imageUrl,
        kind: addons.kind,
      })
      .from(addons)
      .where(eq(addons.isActive, true))
      .orderBy(asc(addons.order)),
  ]);

  const initial: PujaFormValues = {
    slug: "",
    titleEn: "",
    titleHi: "",
    subtitleEn: "",
    subtitleHi: "",
    descriptionEn: "",
    descriptionHi: "",
    benefitsEn: "",
    benefitsHi: "",
    ritualsEn: "",
    ritualsHi: "",
    artKey: "om",
    imageUrl: "",
    addonIds: addonList.map((a) => a.id),
    pujaDate: defaultDateTimeLocal(),
    temple: { nameEn: "", nameHi: "", cityEn: "", cityHi: "", stateEn: "", stateHi: "" },
    category: { nameEn: "", nameHi: "" },
    isFeatured: false,
    isActive: true,
    seatsTotal: "",
    order: 0,
    packages: [
      {
        nameEn: "Individual",
        nameHi: "एकल",
        price: 1100,
        mrp: 1500,
        maxMembers: 1,
        featuresEn:
          "Sankalp with 1 name & gotra\nFull puja video on WhatsApp\nTemple prasad delivered\nPuja completion certificate",
        featuresHi:
          "1 नाम व गोत्र से संकल्प\nव्हाट्सएप पर पूरा पूजा वीडियो\nमंदिर का प्रसाद घर तक\nपूजा संपन्नता प्रमाण-पत्र",
        isPopular: false,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pujas" className="text-[13px] font-semibold text-saffron-700">
          ← Pujas
        </Link>
        <h1 className="mt-1 text-2xl">Nayi puja</h1>
      </div>

      <PujaForm
        initial={initial}
        temples={templeList}
        categories={categoryList}
        allAddons={addonList}
      />
    </div>
  );
}
