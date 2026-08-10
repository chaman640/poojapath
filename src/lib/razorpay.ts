import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { isPaymentLive } from "./env";

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!isPaymentLive()) {
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
