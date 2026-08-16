import { NextResponse } from "next/server";
import { guardAdminApi, jsonError } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  ALLOWED_TYPES,
  MAX_UPLOAD_BYTES,
  isCloudinaryReady,
  uploadImage,
} from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Sirf logged-in admin (+ CSRF check)
  const guard = await guardAdminApi(req);
  if ("response" in guard) return guard.response;

  const limit = rateLimit(`upload:${clientIp(req)}`, {
    limit: 60,
    windowMs: 60 * 60_000,
  });
  if (!limit.ok) return jsonError("Bahut zyada uploads. Thodi der ruk kar karein.", 429);

  if (!isCloudinaryReady()) {
    return jsonError(
      "Cloudinary keys set nahi hain. .env me CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY aur CLOUDINARY_API_SECRET daalein.",
      503,
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("File nahi mili.", 400);
  }

  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "pujas");
  const folder = /^[a-z0-9-]{1,40}$/.test(folderRaw) ? folderRaw : "pujas";

  if (!(file instanceof File)) return jsonError("File nahi mili.", 400);

  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonError("Sirf JPG, PNG, WebP ya AVIF photo daal sakte hain.", 415);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonError("Photo 5 MB se chhoti honi chahiye.", 413);
  }

  try {
    const result = await uploadImage(file, `pooja-path/${folder}`);
    return NextResponse.json({ ok: true, url: result.url });
  } catch (err) {
    console.error("[upload] failed:", err);
    return jsonError("Photo upload nahi ho payi. Dobara koshish karein.", 502);
  }
}
