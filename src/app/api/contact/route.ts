import { NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema, firstError } from "@/lib/validation";
import { guardPublicPost, jsonError } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const csrf = guardPublicPost(req);
  if (csrf) return csrf;

  const ip = clientIp(req);
  const limit = rateLimit(`contact:${ip}`, {
    limit: 5,
    windowMs: 60 * 60_000,
    blockMs: 60 * 60_000,
  });
  if (!limit.ok) return jsonError("Bahut zyada messages. Kal try karein.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstError(parsed.error), 400);

  // Honeypot bhara hua hai => bot hai. Success dikhao par save mat karo.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return jsonError("Sahi 10-digit mobile number daalein.", 400);

  await db.insert(contactMessages).values({
    name: parsed.data.name,
    phone,
    email: parsed.data.email?.trim() || null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  return NextResponse.json({ ok: true });
}
