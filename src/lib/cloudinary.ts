import "server-only";
import { createHash } from "node:crypto";

/**
 * Cloudinary photo upload.
 *
 * Koi SDK nahi — seedha unke REST API par signed upload.
 * API secret sirf server par rehta hai, browser tak kabhi nahi jaata.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export function isCloudinaryReady(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

export type UploadResult = { url: string; publicId: string };

export async function uploadImage(
  file: File,
  folder = "pooja-path",
): Promise<UploadResult> {
  if (!isCloudinaryReady()) {
    throw new Error("Cloudinary keys .env me set nahi hain.");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000);

  // Signature = sha1( alphabetically sorted params + api_secret )
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40_000);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: form, signal: controller.signal },
    );

    const data = (await res.json()) as {
      secure_url?: string;
      public_id?: string;
      error?: { message?: string };
    };

    if (!res.ok || !data.secure_url) {
      throw new Error(data.error?.message || `Cloudinary error ${res.status}`);
    }

    return { url: data.secure_url, publicId: data.public_id ?? "" };
  } finally {
    clearTimeout(timer);
  }
}

export { optimizedImage } from "./utils";
