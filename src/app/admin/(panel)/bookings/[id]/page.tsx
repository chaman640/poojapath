import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookingAddons,
  bookingEvents,
  bookings,
  packages,
  pujas,
  temples,
} from "@/db/schema";
import { formatDate, formatINR } from "@/lib/utils";
import StatusBadge from "../../StatusBadge";
import BookingUpdateForm from "./BookingUpdateForm";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db
    .select({
      b: bookings,
      pujaTitle: pujas.titleEn,
      pujaSlug: pujas.slug,
      pujaDate: pujas.pujaDate,
      pkgName: packages.nameEn,
      templeName: temples.nameEn,
      templeCity: temples.cityEn,
    })
    .from(bookings)
    .innerJoin(pujas, eq(bookings.pujaId, pujas.id))
    .innerJoin(packages, eq(bookings.packageId, packages.id))
    .leftJoin(temples, eq(pujas.templeId, temples.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) notFound();
  const b = row.b;

  const [events, extras] = await Promise.all([
    db
      .select()
      .from(bookingEvents)
      .where(eq(bookingEvents.bookingId, b.id))
      .orderBy(asc(bookingEvents.createdAt)),
    db.select().from(bookingAddons).where(eq(bookingAddons.bookingId, b.id)),
  ]);

  const waLink = `https://wa.me/${b.phone.replace(/\D/g, "")}`;

  const details: Array<[string, string]> = [
    ["Booking ID", b.bookingCode],
    ["Devotee name", b.devoteeName],
    ["Gotra", b.gotra],
    ["Phone", b.phone],
    ["Email", b.email ?? "—"],
    ["Family members", b.memberNames.length ? b.memberNames.join(", ") : "—"],
    ["Sankalp", b.sankalp ?? "—"],
    ["Puja", row.pujaTitle],
    ["Temple", row.templeName ? `${row.templeName}, ${row.templeCity}` : "—"],
    ["Puja date", formatDate(row.pujaDate, "en")],
    ["Package", `${row.pkgName} — ${formatINR(b.packageAmountInPaise || b.amountInPaise)}`],
    [
      "Add-ons",
      extras.length
        ? extras
            .map(
              (x) =>
                `${x.kind === "DELIVERY" ? "📦" : "🪔"} ${x.nameEn} (${formatINR(x.priceInPaise)})`,
            )
            .join(", ")
        : "—",
    ],
    ["Total amount", formatINR(b.amountInPaise)],
    ["Payment status", b.paymentStatus],
    ["Razorpay order", b.razorpayOrderId ?? "—"],
    ["Razorpay payment", b.razorpayPaymentId ?? "—"],
    ["WhatsApp opt-in", b.whatsappOptIn ? "Yes" : "No"],
    ["Booked on", formatDate(b.createdAt, "en")],
  ];

  const address = [b.addressLine, b.city, b.state, b.pincode].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/bookings" className="text-[13px] font-semibold text-saffron-700">
            ← Bookings
          </Link>
          <h1 className="mt-1 font-mono text-2xl">{b.bookingCode}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={b.status} />
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn rounded-full bg-[#25D366] px-4 py-2 text-[13px] font-bold text-white"
          >
            WhatsApp karein
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <h2 className="border-b border-saffron-100 px-5 py-3.5 text-base">Details</h2>
            <dl className="divide-y divide-saffron-50">
              {details.map(([k, v]) => (
                <div key={k} className="flex gap-4 px-5 py-2.5 text-[13.5px]">
                  <dt className="w-40 shrink-0 text-ink/50">{k}</dt>
                  <dd className="min-w-0 break-words font-medium text-maroon-800">{v}</dd>
                </div>
              ))}
              <div className="flex gap-4 px-5 py-2.5 text-[13.5px]">
                <dt className="w-40 shrink-0 text-ink/50">Prasad address</dt>
                <dd className="min-w-0 break-words font-medium text-maroon-800">
                  {address || "— (diya nahi gaya)"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card overflow-hidden">
            <h2 className="border-b border-saffron-100 px-5 py-3.5 text-base">
              Update history
            </h2>
            {events.length === 0 ? (
              <p className="p-6 text-[13.5px] text-ink/50">Abhi koi update nahi.</p>
            ) : (
              <ul className="divide-y divide-saffron-50">
                {events.map((e) => (
                  <li key={e.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={e.status} />
                      <span className="text-[11.5px] text-ink/45">
                        {formatDate(e.createdAt, "en")}
                      </span>
                      {e.notified && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          WhatsApp bheja
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[13px] text-ink/70">{e.messageEn}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <BookingUpdateForm
          bookingId={b.id}
          currentStatus={b.status}
          videoUrl={b.videoUrl ?? ""}
          prasadTracking={b.prasadTracking ?? ""}
          adminNote={b.adminNote ?? ""}
        />
      </div>
    </div>
  );
}
