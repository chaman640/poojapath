import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, packages, pujas, temples } from "@/db/schema";
import { formatDate, formatINR } from "@/lib/utils";
import { deletePujaAction, togglePujaActiveAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminPujasPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;

  const rows = await db
    .select({
      id: pujas.id,
      slug: pujas.slug,
      titleEn: pujas.titleEn,
      pujaDate: pujas.pujaDate,
      isActive: pujas.isActive,
      isFeatured: pujas.isFeatured,
      seatsTotal: pujas.seatsTotal,
      seatsBooked: pujas.seatsBooked,
      templeName: temples.nameEn,
      minPrice: sql<number>`(
        SELECT MIN(${packages.priceInPaise}) FROM ${packages}
        WHERE ${packages.pujaId} = ${pujas.id} AND ${packages.isActive} = true
      )`.mapWith(Number),
      bookingCount: sql<number>`(
        SELECT COUNT(*) FROM ${bookings} WHERE ${bookings.pujaId} = ${pujas.id}
      )`.mapWith(Number),
    })
    .from(pujas)
    .leftJoin(temples, eq(pujas.templeId, temples.id))
    .orderBy(asc(pujas.pujaDate));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Pujas</h1>
          <p className="mt-1 text-[14px] text-ink/55">{rows.length} pujas</p>
        </div>
        <Link href="/admin/pujas/new" className="btn-primary px-5 py-2.5">
          + Nayi puja add karein
        </Link>
      </div>

      {sp.saved === "1" && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-800">
          ✓ Puja save ho gayi.
        </p>
      )}

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-[14px] text-ink/50">
            Abhi koi puja nahi hai. Upar se nayi add karein.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-saffron-50/60 text-left text-[11px] uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Puja</th>
                  <th className="px-4 py-2.5 font-bold">Temple</th>
                  <th className="px-4 py-2.5 font-bold">Date</th>
                  <th className="px-4 py-2.5 font-bold">From</th>
                  <th className="px-4 py-2.5 font-bold">Seats</th>
                  <th className="px-4 py-2.5 font-bold">Bookings</th>
                  <th className="px-4 py-2.5 font-bold">Live</th>
                  <th className="px-4 py-2.5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-50">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-saffron-50/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pujas/${p.id}`}
                        className="font-semibold text-maroon-800 hover:text-saffron-700"
                      >
                        {p.titleEn}
                      </Link>
                      <p className="text-[11.5px] text-ink/45">/{p.slug}</p>
                      {p.isFeatured && (
                        <span className="mt-1 inline-block rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-600">
                          ★ Featured
                        </span>
                      )}
                    </td>
                    <td className="max-w-[170px] truncate px-4 py-3 text-ink/70">
                      {p.templeName ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-ink/60">
                      {formatDate(p.pujaDate, "en")}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {p.minPrice ? formatINR(p.minPrice) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {p.seatsTotal != null
                        ? `${p.seatsBooked}/${p.seatsTotal}`
                        : "unlimited"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-maroon-800">
                      {p.bookingCount}
                    </td>
                    <td className="px-4 py-3">
                      <form action={togglePujaActiveAction}>
                        <input type="hidden" name="pujaId" value={p.id} />
                        <input type="hidden" name="next" value={String(!p.isActive)} />
                        <button
                          type="submit"
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            p.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {p.isActive ? "Live" : "Hidden"}
                        </button>
                      </form>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        href={`/admin/pujas/${p.id}`}
                        className="text-[12.5px] font-semibold text-saffron-700 hover:underline"
                      >
                        Edit
                      </Link>
                      <span className="mx-2 text-ink/20">|</span>
                      <form action={deletePujaAction} className="inline">
                        <input type="hidden" name="pujaId" value={p.id} />
                        <button
                          type="submit"
                          className="text-[12.5px] font-semibold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[12.5px] leading-relaxed text-ink/50">
        Note: jis puja par bookings hain, wo delete nahi hoti — wo apne aap “Hidden” ho
        jati hai taaki purani bookings ka record surakshit rahe.
      </p>
    </div>
  );
}
