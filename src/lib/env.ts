/**
 * Environment variables ka ek hi jagah se access.
 * Server-only values ko kabhi client component me import mat karein.
 */

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Pooja Path",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+919000000000",
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "+919000000000",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@poojapath.in",
  /** Payment gateway KYC ke liye zaroori — legal aur contact page par dikhta hai */
  legalName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "Pooja Path",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
  gstin: process.env.NEXT_PUBLIC_GSTIN || "",
};

/** WhatsApp provider configure hua hai ya nahi */
export function whatsappProvider(): "aisensy" | "interakt" | "none" {
  const p = (process.env.WHATSAPP_PROVIDER || "none").toLowerCase();
  if (p === "aisensy" && process.env.AISENSY_API_KEY?.trim()) return "aisensy";
  if (p === "interakt" && process.env.INTERAKT_API_KEY?.trim())
    return "interakt";
  return "none";
}

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET missing ya bahut chhota hai. .env me kam se kam 32 character ka random secret daalein.",
    );
  }
  return new TextEncoder().encode(secret);
}

export const isProd = process.env.NODE_ENV === "production";
