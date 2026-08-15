import Link from "next/link";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { activeProvider } from "@/lib/payments";
import { bookings, contactMessages, pujas } from "@/db/schema";
import { formatDate, formatINR } from "@/lib/utils";
import {whatsappProvider} from "@/lib/env";
import StatusBadge from "./StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [[stats], recent, [msgCount]] = await Promise.all([
    db
      .select({
        total: sql<number>`COUNT(*)`.mapWith(Number),
        confirmed: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} <> 'PENDING_PAYMENT' AND ${bookings.status} <> 'CANCELLED')`.mapWith(Number),
        pending: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} = 'PENDING_PAYMENT')`.mapWith(Number),
        revenue: sql<number>`COALESCE(SUM(${bookings.amountInPaise}) FILTER (WHERE ${bookings.status} <> 'PENDING_PAYMENT' AND ${bookings.status} <> 'CANCELLED' AND ${bookings.status} <> 'REFUNDED'), 0)`.mapWith(Number),
        last30: sql<number>`COUNT(*) FILTER (WHERE ${bookings.createdAt} >= now() - interval '30 days')`.mapWith(Number),
      })
      .from(bookings),
    db
      .select({
        id: bookings.id,
        code: bookings.bookingCode,
        name: bookings.devoteeName,
        phone: bookings.phone,
        amount: bookings.amountInPaise,
        status: bookings.status,
        createdAt: bookings.createdAt,
        pujaTitle: pujas.titleEn,
      })
      .from(bookings)
      .innerJoin(pujas, eq(bookings.pujaId, pujas.id))
      .orderBy(desc(bookings.createdAt))
      .limit(8),
    db
      .select({ unread: sql<number>`COUNT(*) FILTER (WHERE ${contactMessages.isRead} = false)`.mapWith(Number) })
      .from(contactMessages),
  ]);

  const [activePujas] = await db
    .select({
      n: sql<number>`COUNT(*) FILTER (WHERE ${pujas.isActive} = true)`.mapWith(Number),
    })
    .from(pujas);

  const cards = [
    { label: "Total bookings", value: stats.total, tone: "text-maroon-800" },
    { label: "Confirmed", value: stats.confirmed, tone: "text-green-700" },
    { label: "Payment pending", value: stats.pending, tone: "text-amber-700" },
    { label: "Revenue (confirmed)", value: formatINR(stats.revenue), tone: "text-saffron-700" },
    { label: "Bookings (30 days)", value: stats.last30, tone: "text-maroon-800" },
    { label: "Active pujas", value: activePujas.n, tone: "text-maroon-800" },
  ];

  const waProvider = whatsappProvider();
  const payProvider = activeProvider();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">Dashboard</h1>
        <p className="mt-1 text-[14px] text-ink/55">Aaj ki sthiti ek nazar mein</p>
      </div>

      {/* Setup warnings */}
      <div className="grid gap-3 sm:grid-cols-2">
        {payProvider === "none" && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-[13px] font-bold text-amber-900">
              ⚠️ Payment gateway connect nahi hai
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-amber-800">
              Site abhi Demo Mode me hai — booking ban jati hai par paisa nahi katta.
              Render ke Environment tab me <code>RAZORPAY_KEY_ID</code> aur{" "}
              <code>RAZORPAY_KEY_SECRET</code> daal kar redeploy karein.
            </p>
          </div>
        )}
        {payProvider !== "none" && (
          <div className="rounded-2xl border border-green-300 bg-green-50 p-4">
            <p className="text-[13px] font-bold text-green-900">
              ✓ Payment gateway chalu hai ({payProvider})
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-green-800">
              Bookings par asli payment liya ja raha hai.
              {payProvider === "razorpay" && (
                <>
                  {" "}Webhook URL: <code>/api/payment/webhook</code>
                </>
              )}
            </p>
          </div>
        )}
        {waProvider === "none" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[13px] font-bold text-blue-900">ℹ️ WhatsApp updates band hain</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-blue-800">
              Message abhi sirf server log me jate hain. AiSensy/Interakt ki API key{" "}
              <code>.env</code> me daalte hi apne aap chalu ho jayenge.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">
              {c.label}
            </p>
            <p className={`mt-2 font-display text-2xl font-bold ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-saffron-100 px-5 py-4">
          <h2 className="text-lg">Recent bookings</h2>
          <Link href="/admin/bookings" className="text-[13px] font-semibold text-saffron-700">
            Sabhi dekhein →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="p-8 text-center text-[14px] text-ink/50">Abhi koi booking nahi hai.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead className="bg-saffron-50/60 text-left text-[11px] uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-5 py-2.5 font-bold">Booking ID</th>
                  <th className="px-5 py-2.5 font-bold">Devotee</th>
                  <th className="px-5 py-2.5 font-bold">Puja</th>
                  <th className="px-5 py-2.5 font-bold">Amount</th>
                  <th className="px-5 py-2.5 font-bold">Status</th>
                  <th className="px-5 py-2.5 font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-50">
                {recent.map((b) => (
                  <tr key={b.id} className="hover:bg-saffron-50/40">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-mono text-[12.5px] font-bold text-saffron-700"
                      >
                        {b.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-maroon-800">{b.name}</p>
                      <p className="text-[12px] text-ink/50">{b.phone}</p>
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3 text-ink/70">{b.pujaTitle}</td>
                    <td className="px-5 py-3 font-semibold">{formatINR(b.amount)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[12.5px] text-ink/55">
                      {formatDate(b.createdAt, "en")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {msgCount.unread > 0 && (
        <Link
          href="/admin/messages"
          className="card block bg-saffron-50 p-4 text-[14px] font-semibold text-maroon-800"
        >
          📩 {msgCount.unread} naye contact message padhe nahi gaye →
        </Link>
      )}
    </div>
  );
}
