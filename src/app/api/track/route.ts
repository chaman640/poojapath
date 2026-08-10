import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { trackSchema } from "@/lib/validation";
import { guardPublicPost, jsonError } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const csrf = guardPublicPost(req);
  if (csrf) return csrf;

  // Brute force se bachne ke liye sakht limit
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
  if (!parsed.success) return jsonError("Booking ID aur number sahi daalein.", 400);

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return jsonError("Sahi 10-digit mobile number daalein.", 400);

  const [row] = await db
    .select({ code: bookings.bookingCode })
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingCode, parsed.data.bookingCode.trim().toUpperCase()),
        eq(bookings.phone, phone),
      ),
    )
    .limit(1);

  if (!row) return jsonError("not_found", 404);

  return NextResponse.json({ ok: true, bookingCode: row.code });
}
