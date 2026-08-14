import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { addons, pujaAddons } from "@/db/schema";
import { formatINR, optimizedImage } from "@/lib/utils";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { deleteAddonAction, toggleAddonActiveAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminAddonsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;

  const rows = await db
    .select({
      id: addons.id,
      slug: addons.slug,
      nameEn: addons.nameEn,
      nameHi: addons.nameHi,
      priceInPaise: addons.priceInPaise,
      imageUrl: addons.imageUrl,
      kind: addons.kind,
      isActive: addons.isActive,
      usedIn: sql<number>`(
        SELECT COUNT(*) FROM ${pujaAddons} WHERE ${pujaAddons.addonId} = ${addons.id}
      )`.mapWith(Number),
    })
    .from(addons)
    .orderBy(asc(addons.order), asc(addons.nameEn));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Add-ons</h1>
          <p className="mt-1 text-[14px] text-ink/55">
            Extra saamaan aur seva jo user booking ke waqt jod sakta hai
          </p>
        </div>
        <Link href="/admin/addons/new" className="btn-primary px-5 py-2.5">
          + Naya add-on
        </Link>
      </div>

      {sp.saved === "1" && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-800">
          ✓ Add-on save ho gaya. Ab kisi puja me jaake ise select kar dein.
        </p>
      )}

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl">🧺</p>
          <p className="mt-3 text-[14px] text-ink/55">
            Abhi koi add-on nahi hai. Upar se pehla banayein — jaise
            “Prasad ghar par”, “Rudraksh mala”, “Deepdaan”.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => (
            <article key={a.id} className="card overflow-hidden">
              <div className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-saffron-100">
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={optimizedImage(a.imageUrl, 200) ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-2xl">
                      {a.kind === "DELIVERY" ? "📦" : "🛕"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-maroon-800">
                    {a.nameEn}
                  </p>
                  <p className="truncate text-[12.5px] text-ink/55">{a.nameHi}</p>
                  <p className="mt-1 font-display text-lg font-bold text-saffron-700">
                    {formatINR(a.priceInPaise)}
                  </p>
                  <p className="mt-1 text-[11px] text-ink/45">
                    {a.usedIn} puja me lagaya hua
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-saffron-50 px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    a.kind === "DELIVERY"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {a.kind === "DELIVERY" ? "📦 Ghar bhejna" : "🛕 Mandir seva"}
                </span>

                <form action={toggleAddonActiveAction}>
                  <input type="hidden" name="addonId" value={a.id} />
                  <input type="hidden" name="next" value={String(!a.isActive)} />
                  <button
                    type="submit"
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      a.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {a.isActive ? "Live" : "Hidden"}
                  </button>
                </form>

                <div className="ml-auto flex items-center gap-2">
                  <Link
                    href={`/admin/addons/${a.id}`}
                    className="text-[12.5px] font-semibold text-saffron-700 hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={deleteAddonAction}>
                    <input type="hidden" name="addonId" value={a.id} />
                    <ConfirmSubmit
                      message={`"${a.nameEn}" delete karein?`}
                      className="text-[12.5px] font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
