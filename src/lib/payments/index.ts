import "server-only";
import { siteConfig } from "../env";
import * as paytm from "./paytm";
import * as razorpay from "./razorpay";

/**
 * Payment provider ka ek hi darwaza.
 *
 * .env me PAYMENT_PROVIDER badal kar aap Paytm aur Razorpay ke beech
 * switch kar sakte hain — baaki code chhune ki zaroorat nahi.
 * Dono me se koi bhi set na ho to site "Demo Mode" me chalti hai.
 */

export type Provider = "paytm" | "razorpay" | "none";

export function activeProvider(): Provider {
  const wanted = (process.env.PAYMENT_PROVIDER || "").trim().toLowerCase();

  if (wanted === "paytm") return paytm.isPaytmLive() ? "paytm" : "none";
  if (wanted === "razorpay") return razorpay.isRazorpayLive() ? "razorpay" : "none";

  // PAYMENT_PROVIDER khaali ho to jo bhi configure hai wahi use karo
  if (paytm.isPaytmLive()) return "paytm";
  if (razorpay.isRazorpayLive()) return "razorpay";
  return "none";
}

export function isPaymentLive(): boolean {
  return activeProvider() !== "none";
}

/** Booking page ko bheja jaane wala data */
export type PaymentSession =
  | { mode: "demo" }
  | {
      mode: "paytm";
      mid: string;
      orderId: string;
      txnToken: string;
      amount: string;
      scriptUrl: string;
    }
  | {
      mode: "razorpay";
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    };

export async function createPaymentSession(params: {
  bookingCode: string;
  amountInPaise: number;
  pujaTitle: string;
}): Promise<{ session: PaymentSession; providerOrderId: string | null }> {
  const provider = activeProvider();

  if (provider === "none") {
    return { session: { mode: "demo" }, providerOrderId: null };
  }

  if (provider === "paytm") {
    const s = await paytm.initiateTransaction({
      orderId: params.bookingCode,
      amountInPaise: params.amountInPaise,
      customerId: params.bookingCode,
      callbackUrl: `${siteConfig.url.replace(/\/$/, "")}/api/payment/paytm/callback`,
    });

    return {
      session: {
        mode: "paytm",
        mid: s.mid,
        orderId: s.orderId,
        txnToken: s.txnToken,
        amount: s.amount,
        scriptUrl: s.scriptUrl,
      },
      providerOrderId: s.orderId,
    };
  }

  const order = await razorpay.createOrder({
    amountInPaise: params.amountInPaise,
    receipt: params.bookingCode,
    notes: { bookingCode: params.bookingCode, puja: params.pujaTitle.slice(0, 100) },
  });

  return {
    session: {
      mode: "razorpay",
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
    },
    providerOrderId: order.orderId,
  };
}

export { paytm, razorpay };
