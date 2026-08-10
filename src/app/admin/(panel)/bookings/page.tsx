import Link from "next/link";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { bookings, pujas } from "@/db/schema";
import type { BookingStatus } from "@/db/schema";
import { formatDate, formatINR } from "@/lib/utils";
import StatusBadge from "../StatusBadge";

export const dynamic = "force-dynamic";

const STATUSES: BookingStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PERFORMED",
  "VIDEO_SENT",
  "PRASAD_DISPATCHED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const status = STATUSES.includes(sp.status as BookingStatus)
    ? (sp.status as BookingStatus)
    : undefined;

  const conditions: SQL[] = [];
  if (status) conditions.push(eq(bookings.status, status));
  if (q) {
    const term = `%${q}%`;
    const search = or(
      ilike(bookings.bookingCode, term),
      ilike(bookings.devoteeName, term),
      ilike(bookings.phone, term),
      ilike(bookings.gotra, term),
    );
    if (search) conditions.push(search);
  }

  const rows = await db
    .select({
      id: bookings.id,
      code: bookings.bookingCode,
      name: bookings.devoteeName,
      gotra: bookings.gotra,
      phone: bookings.phone,
      amount: bookings.amountInPaise,
      status: bookings.status,
      createdAt: bookings.createdAt,
      pujaTitle: pujas.titleEn,
      pujaDate: pujas.pujaDate,
    })
    .from(bookings)
    .innerJoin(pujas, eq(bookings.pujaId, pujas.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(bookings.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Bookings</h1>
          <p className="mt-1 text-[14px] text-ink/55">{rows.length} results</p>
        </div>

        <form method="GET" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Booking ID, naam, phone…"
            maxLength={60}
            className="input w-56 py-2"
          />
          <select name="status" defaultValue={status ?? ""} className="input w-44 py-2">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary px-5">
            Filter
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-[14px] text-ink/50">Koi booking nahi mili.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-saffron-50/60 text-left text-[11px] uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Booking ID</th>
                  <th className="px-4 py-2.5 font-bold">Devotee</th>
                  <th className="px-4 py-2.5 font-bold">Gotra</th>
                  <th className="px-4 py-2.5 font-bold">Puja</th>
                  <th className="px-4 py-2.5 font-bold">Puja date</th>
                  <th className="px-4 py-2.5 font-bold">Amount</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold">Booked on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-50">
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-saffron-50/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-mono text-[12.5px] font-bold text-saffron-700 hover:underline"
                      >
                        {b.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-maroon-800">{b.name}</p>
                      <p className="text-[12px] text-ink/50">{b.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-ink/70">{b.gotra}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-ink/70">
                      {b.pujaTitle}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-ink/60">
                      {formatDate(b.pujaDate, "en")}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatINR(b.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-ink/55">
                      {formatDate(b.createdAt, "en")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
