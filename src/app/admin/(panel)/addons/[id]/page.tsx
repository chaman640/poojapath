import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addons } from "@/db/schema";
import AddonForm, { type AddonFormValues } from "../AddonForm";

export const dynamic = "force-dynamic";

export default async function EditAddonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db.select().from(addons).where(eq(addons.id, id)).limit(1);
  if (!row) notFound();

  const initial: AddonFormValues = {
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    descEn: row.descEn,
    descHi: row.descHi,
    price: Math.round(row.priceInPaise / 100),
    imageUrl: row.imageUrl ?? "",
    artKey: row.artKey,
    kind: row.kind,
    isActive: row.isActive,
    order: row.order,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/addons" className="text-[13px] font-semibold text-saffron-700">
          ← Add-ons
        </Link>
        <h1 className="mt-1 text-2xl">{row.nameEn}</h1>
      </div>

      <AddonForm initial={initial} />
    </div>
  );
}
