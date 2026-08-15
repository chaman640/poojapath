import "server-only";

/**
 * Webhook aa raha hai ya nahi — iska chhota sa record.
 *
 * Sirf memory me rehta hai (server restart par mit jata hai). Maqsad sirf
 * itna hai ki Admin → Payments page par ye dikh sake: "webhook zinda hai"
 * ya "abhi tak ek bhi webhook nahi aaya". Isse pata chal jata hai ki
 * Razorpay dashboard me URL sahi daala gaya hai ya nahi.
 */

type WebhookHit = {
  at: number;
  event: string;
  ok: boolean;
  detail: string;
};

let last: WebhookHit | null = null;
let total = 0;
let rejected = 0;

export function recordWebhook(hit: Omit<WebhookHit, "at">) {
  last = { ...hit, at: Date.now() };
  total++;
  if (!hit.ok) rejected++;
}

export function webhookStatus() {
  return { last, total, rejected };
}
