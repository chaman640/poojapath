import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories, temples } from "@/db/schema";
import PujaForm, { type PujaFormValues } from "../PujaForm";

export const dynamic = "force-dynamic";

function defaultDateTimeLocal() {
  const d = new Date(Date.now() + 7 * 86_400_000);
  d.setHours(8, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function NewPujaPage() {
  const [templeList, categoryList] = await Promise.all([
    db
      .select({ id: temples.id, nameEn: temples.nameEn, cityEn: temples.cityEn })
      .from(temples)
      .orderBy(asc(temples.nameEn)),
    db
      .select({ id: categories.id, nameEn: categories.nameEn })
      .from(categories)
      .orderBy(asc(categories.order)),
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
    pujaDate: defaultDateTimeLocal(),
    templeId: "",
    categoryId: "",
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

      <PujaForm initial={initial} temples={templeList} categories={categoryList} />
    </div>
  );
}
