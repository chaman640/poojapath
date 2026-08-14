import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addons, categories, packages, pujaAddons, pujas, temples } from "@/db/schema";
import PujaForm, { type PujaFormValues } from "../PujaForm";

export const dynamic = "force-dynamic";

function toDateTimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditPujaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [puja] = await db.select().from(pujas).where(eq(pujas.id, id)).limit(1);
  if (!puja) notFound();

  const [pkgs, templeList, categoryList, addonList, linked] = await Promise.all([
    db
      .select()
      .from(packages)
      .where(and(eq(packages.pujaId, puja.id), eq(packages.isActive, true)))
      .orderBy(asc(packages.order)),
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
    db
      .select({ addonId: pujaAddons.addonId })
      .from(pujaAddons)
      .where(eq(pujaAddons.pujaId, puja.id)),
  ]);

  const [currentTempleRow] = puja.templeId
    ? await db
        .select()
        .from(temples)
        .where(eq(temples.id, puja.templeId))
        .limit(1)
    : [];

  const [currentCategoryRow] = puja.categoryId
    ? await db
        .select()
        .from(categories)
        .where(eq(categories.id, puja.categoryId))
        .limit(1)
    : [];

  const currentTemple = currentTempleRow
    ? {
        nameEn: currentTempleRow.nameEn,
        nameHi: currentTempleRow.nameHi,
        cityEn: currentTempleRow.cityEn,
        cityHi: currentTempleRow.cityHi,
        stateEn: currentTempleRow.stateEn,
        stateHi: currentTempleRow.stateHi,
      }
    : { nameEn: "", nameHi: "", cityEn: "", cityHi: "", stateEn: "", stateHi: "" };

  const currentCategory = currentCategoryRow
    ? { nameEn: currentCategoryRow.nameEn, nameHi: currentCategoryRow.nameHi }
    : { nameEn: "", nameHi: "" };

  const initial: PujaFormValues = {
    id: puja.id,
    slug: puja.slug,
    titleEn: puja.titleEn,
    titleHi: puja.titleHi,
    subtitleEn: puja.subtitleEn,
    subtitleHi: puja.subtitleHi,
    descriptionEn: puja.descriptionEn,
    descriptionHi: puja.descriptionHi,
    benefitsEn: puja.benefitsEn.join("\n"),
    benefitsHi: puja.benefitsHi.join("\n"),
    ritualsEn: puja.ritualsEn.join("\n"),
    ritualsHi: puja.ritualsHi.join("\n"),
    artKey: puja.artKey,
    imageUrl: puja.imageUrl ?? "",
    addonIds: linked.map((l) => l.addonId),
    pujaDate: toDateTimeLocal(puja.pujaDate),
    temple: currentTemple,
    category: currentCategory,
    isFeatured: puja.isFeatured,
    isActive: puja.isActive,
    seatsTotal: puja.seatsTotal != null ? String(puja.seatsTotal) : "",
    order: puja.order,
    packages: pkgs.map((p) => ({
      id: p.id,
      nameEn: p.nameEn,
      nameHi: p.nameHi,
      price: Math.round(p.priceInPaise / 100),
      mrp: p.mrpInPaise != null ? Math.round(p.mrpInPaise / 100) : null,
      maxMembers: p.maxMembers,
      featuresEn: p.featuresEn.join("\n"),
      featuresHi: p.featuresHi.join("\n"),
      isPopular: p.isPopular,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/pujas" className="text-[13px] font-semibold text-saffron-700">
            ← Pujas
          </Link>
          <h1 className="mt-1 text-2xl">{puja.titleEn}</h1>
        </div>
        <Link
          href={`/pujas/${puja.slug}`}
          target="_blank"
          className="btn-secondary px-4 py-2 text-[13px]"
        >
          Site par dekhein ↗
        </Link>
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
