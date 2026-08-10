import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, packages, pujas, temples } from "@/db/schema";
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

  const [pkgs, templeList, categoryList] = await Promise.all([
    db
      .select()
      .from(packages)
      .where(and(eq(packages.pujaId, puja.id), eq(packages.isActive, true)))
      .orderBy(asc(packages.order)),
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
    pujaDate: toDateTimeLocal(puja.pujaDate),
    templeId: puja.templeId ?? "",
    categoryId: puja.categoryId ?? "",
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

      <PujaForm initial={initial} temples={templeList} categories={categoryList} />
    </div>
  );
}
