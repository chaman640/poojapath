import { NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { bookings, pujas, temples } from "@/db/schema";
import { trackSchema } from "@/lib/validation";
import { guardPublicPost, jsonError } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";
import { reconcilePendingForPhone } from "@/lib/payments/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Booking tracking.
 *
 * Sirf mobile number se saari bookings mil jati hain — user ke liye sabse aasan.
 * Privacy ke liye is list me sirf puja ka naam, tithi aur status bhejte hain;
 * naam, gotra aur pata yahan nahi aate.
 *
 * Number guessing rokne ke liye sakht rate limit hai (10 min me 8 koshish).
 */
export async function POST(req: Request) {
  const csrf = guardPublicPost(req);
  if (csrf) return csrf;

  const ip = clientIp(req);
  const limit = rateLimit(`track:${ip}`, {
    limit: 8,
    windowMs: 10 * 60_000,
    blockMs: 20 * 60_000,
  });
  if (!limit.ok) {
    return jsonError("Bahut zyada koshishein. Thodi der baad try karein.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) return jsonError("Sahi 10-digit mobile number daalein.", 400);

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return jsonError("Sahi 10-digit mobile number daalein.", 400);

  const code = parsed.data.bookingCode?.trim().toUpperCase();

  /* ---- Agar Booking ID bhi diya hai to seedha wahi booking ---- */
  if (code) {
    const [row] = await db
      .select({ code: bookings.bookingCode })
      .from(bookings)
      .where(and(eq(bookings.bookingCode, code), eq(bookings.phone, phone)))
      .limit(1);

    if (!row) return jsonError("not_found", 404);
    return NextResponse.json({ ok: true, bookingCode: row.code });
  }

  /**
   * List dikhane se pehle gateway se poochh lo.
   *
   * Agar user ne paisa de diya tha par browser wapas nahi aaya (mobile par
   * UPI app se aksar hota hai), to yahin booking confirm ho jayegi aur
   * neeche list me sahi status dikhega — "Payment pending" nahi.
   */
  await reconcilePendingForPhone(phone).catch(() => null);

  /* ---- Sirf number: uski saari bookings ki list ---- */
  const rows = await db
    .select({
      bookingCode: bookings.bookingCode,
      status: bookings.status,
      amountInPaise: bookings.amountInPaise,
      createdAt: bookings.createdAt,
      pujaTitleEn: pujas.titleEn,
      pujaTitleHi: pujas.titleHi,
      pujaDate: pujas.pujaDate,
      artKey: pujas.artKey,
      imageUrl: pujas.imageUrl,
      templeNameEn: temples.nameEn,
      templeNameHi: temples.nameHi,
    })
    .from(bookings)
    .innerJoin(pujas, eq(bookings.pujaId, pujas.id))
    .leftJoin(temples, eq(pujas.templeId, temples.id))
    .where(and(eq(bookings.phone, phone), ne(bookings.status, "CANCELLED")))
    .orderBy(desc(bookings.createdAt))
    .limit(30);

  if (rows.length === 0) return jsonError("not_found", 404);

  // Jo abhi baaki hain wo pehle, poori ho chuki neeche
  const DONE = new Set(["COMPLETED", "REFUNDED"]);
  const upcoming = rows.filter((r) => !DONE.has(r.status));
  const past = rows.filter((r) => DONE.has(r.status));

  return NextResponse.json({
    ok: true,
    bookings: [...upcoming, ...past].map((r) => ({
      ...r,
      pujaDate: r.pujaDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
