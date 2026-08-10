import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** paise -> "₹2,100" */
export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatDate(date: Date | string, lang: "en" | "hi" = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export function formatDateShort(date: Date | string, lang: "en" | "hi" = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

/** PP-260810-4F7K2Q jaisa readable booking code */
export function generateBookingCode(): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // confusing chars hataye
  const bytes = randomBytes(6);
  let rand = "";
  for (let i = 0; i < 6; i++) rand += alphabet[bytes[i] % alphabet.length];
  return `PP-${yy}${mm}${dd}-${rand}`;
}

/** IP ko plain me store nahi karte — sirf hash (privacy) */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.AUTH_SECRET || ""))
    .digest("hex")
    .slice(0, 64);
}

/** Length-safe constant-time compare */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ऀ-ॿ]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Phone ko +91XXXXXXXXXX normalize karta hai */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2)))
    return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("091")) return `+${digits.slice(1)}`;
  return null;
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return "••••";
  return phone.slice(0, 3) + "••••" + phone.slice(-3);
}
