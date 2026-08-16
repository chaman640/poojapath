import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";


export function isRazorpayLive(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim(),
  );
}

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!isRazorpayLive()) {
    throw new Error("Razorpay keys .env me set nahi hain.");
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

export type CreatedOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

export async function createOrder(params: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<CreatedOrder> {
  const order = await getClient().orders.create({
    amount: params.amountInPaise,
    currency: "INR",
    receipt: params.receipt.slice(0, 40),
    payment_capture: true,
    notes: params.notes,
  });

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID!,
  };
}

/** Checkout ke baad browser se aaya signature verify karo */
export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = createHmac("sha256", secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  return safeCompareHex(expected, input.signature);
}

/** Razorpay webhook ka signature verify karo (raw body chahiye) */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompareHex(expected, signature);
}

/** Payment ki asli sthiti Razorpay se confirm karo (bharosa server par) */
export async function fetchPayment(paymentId: string) {
  return getClient().payments.fetch(paymentId);
}

export type OrderPayment = {
  id: string;
  status: string; // created | authorized | captured | refunded | failed
  amount: number;
  method?: string | null;
  errorDescription?: string | null;
  createdAt: number | null;
};

/**
 * Ek order par ab tak jitni bhi payment koshishein hui hain, sab.
 *
 * Ye reconcile ke liye sabse bharosemand tareeka hai: booking ke paas
 * sirf order id hoti hai (payment id tabhi milti hai jab browser wapas
 * aata hai). Browser wapas na aaye — user ne UPI app me paisa de diya aur
 * tab band kar di — to bhi order se payment dhoondh kar booking confirm
 * ho jati hai.
 */
export async function fetchOrderPayments(orderId: string): Promise<OrderPayment[]> {
  const res = (await getClient().orders.fetchPayments(orderId)) as unknown as {
    items?: Array<{
      id: string;
      status: string;
      amount: number | string;
      method?: string;
      error_description?: string | null;
      created_at?: number;
    }>;
  };

  return (res?.items ?? []).map((p) => ({
    id: p.id,
    status: String(p.status),
    amount: Number(p.amount),
    method: p.method ?? null,
    errorDescription: p.error_description ?? null,
    createdAt: p.created_at ?? null,
  }));
}

/** Order khud kya kehta hai — `paid` hone par amount_paid pura ho jata hai */
export async function fetchOrder(orderId: string) {
  return getClient().orders.fetch(orderId);
}

export type RecentPayment = OrderPayment & {
  orderId: string | null;
  bookingCodeHint: string | null;
  contact: string | null;
  email: string | null;
};

/**
 * Razorpay par aayi pichhli payments — ulti taraf se milaan ke liye.
 *
 * `fetchOrderPayments` humari booking se shuru hoti hai. Lekin agar kisi
 * wajah se booking par order id save hi na hui ho, to us raaste se wo
 * payment kabhi nahi milegi. Isliye ye function Razorpay ki taraf se
 * shuru karta hai: "tumhare paas kya-kya aaya hai?" — phir hum har payment
 * ko apni booking se jodne ki koshish karte hain.
 */
export async function fetchRecentPayments(count = 25): Promise<RecentPayment[]> {
  const res = (await getClient().payments.all({
    count: Math.min(Math.max(count, 1), 100),
  })) as unknown as {
    items?: Array<{
      id: string;
      status: string;
      amount: number | string;
      method?: string;
      order_id?: string | null;
      error_description?: string | null;
      created_at?: number;
      contact?: string | number | null;
      email?: string | null;
      notes?: Record<string, string> | null;
    }>;
  };

  return (res?.items ?? []).map((p) => ({
    id: p.id,
    status: String(p.status),
    amount: Number(p.amount),
    method: p.method ?? null,
    errorDescription: p.error_description ?? null,
    createdAt: p.created_at ?? null,
    orderId: p.order_id ?? null,
    bookingCodeHint: p.notes?.bookingCode ?? null,
    contact: p.contact != null ? String(p.contact) : null,
    email: p.email ?? null,
  }));
}

/** Sirf dikhane ke liye — poori key kabhi log/screen par nahi jani chahiye */
export function maskedKeyId(): string {
  const k = process.env.RAZORPAY_KEY_ID?.trim();
  if (!k) return "";
  return k.length <= 10 ? k : `${k.slice(0, 8)}…${k.slice(-4)}`;
}

/** Test key ya live key? Galti pakadne me bahut kaam aata hai */
export function keyMode(): "test" | "live" | "unknown" {
  const k = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  if (k.startsWith("rzp_test")) return "test";
  if (k.startsWith("rzp_live")) return "live";
  return "unknown";
}

export function hasWebhookSecret(): boolean {
  return Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim());
}

function safeCompareHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ab.length === 0 || ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}
