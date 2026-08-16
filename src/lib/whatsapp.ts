import "server-only";
import { whatsappProvider, siteConfig } from "./env";

/**
 * WhatsApp updates — AiSensy ya Interakt.
 *
 * Jab tak .env me API key nahi hai, provider "none" rahega:
 * message console par log hoga aur booking normal chalti rahegi.
 * Key daalte hi apne aap live ho jayega — code badalne ki zaroorat nahi.
 */

export type WaBookingPayload = {
  phone: string; // +91XXXXXXXXXX
  name: string;
  bookingCode: string;
  pujaTitle: string;
  pujaDate: string;
  amount: string;
  trackUrl: string;
};

export type WaStatusPayload = {
  phone: string;
  name: string;
  bookingCode: string;
  statusText: string;
  detail: string;
  trackUrl: string;
};

type SendResult = { sent: boolean; provider: string; error?: string };

async function postJson(url: string, body: unknown, headers: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 300)}`);
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/* ----------------------------- AiSensy ----------------------------- */

async function sendAiSensy(
  campaign: string,
  destination: string,
  userName: string,
  templateParams: string[],
) {
  return postJson(
    "https://backend.aisensy.com/campaign/t1/api/v2",
    {
      apiKey: process.env.AISENSY_API_KEY,
      campaignName: campaign,
      destination,
      userName,
      templateParams,
    },
    {},
  );
}

/* ----------------------------- Interakt ---------------------------- */

async function sendInterakt(
  template: string,
  phone: string,
  bodyValues: string[],
) {
  const digits = phone.replace(/\D/g, "");
  const countryCode = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)}` : "+91";
  const phoneNumber = digits.slice(-10);

  return postJson(
    "https://api.interakt.ai/v1/public/message/",
    {
      countryCode,
      phoneNumber,
      type: "Template",
      template: { name: template, languageCode: "en", bodyValues },
    },
    { Authorization: `Basic ${process.env.INTERAKT_API_KEY}` },
  );
}

/* ------------------------------ Public ----------------------------- */

export async function sendBookingConfirmation(
  p: WaBookingPayload,
): Promise<SendResult> {
  const provider = whatsappProvider();
  const params = [
    p.name,
    p.bookingCode,
    p.pujaTitle,
    p.pujaDate,
    p.amount,
    p.trackUrl,
  ];

  if (provider === "none") {
    console.info(
      `[whatsapp:demo] ${p.phone} → ${siteConfig.name}: Booking ${p.bookingCode} confirmed for ${p.pujaTitle} on ${p.pujaDate}. Track: ${p.trackUrl}`,
    );
    return { sent: false, provider: "none" };
  }

  try {
    if (provider === "aisensy") {
      await sendAiSensy(
        process.env.AISENSY_CAMPAIGN_BOOKING || "booking_confirmed",
        p.phone,
        p.name,
        params,
      );
    } else {
      await sendInterakt(
        process.env.INTERAKT_TEMPLATE_BOOKING || "booking_confirmed",
        p.phone,
        params,
      );
    }
    return { sent: true, provider };
  } catch (err) {
    console.error("[whatsapp] booking message failed:", err);
    return { sent: false, provider, error: String(err) };
  }
}

export async function sendStatusUpdate(p: WaStatusPayload): Promise<SendResult> {
  const provider = whatsappProvider();
  const params = [p.name, p.bookingCode, p.statusText, p.detail, p.trackUrl];

  if (provider === "none") {
    console.info(
      `[whatsapp:demo] ${p.phone} → Booking ${p.bookingCode}: ${p.statusText} — ${p.detail}`,
    );
    return { sent: false, provider: "none" };
  }

  try {
    if (provider === "aisensy") {
      await sendAiSensy(
        process.env.AISENSY_CAMPAIGN_STATUS || "booking_status_update",
        p.phone,
        p.name,
        params,
      );
    } else {
      await sendInterakt(
        process.env.INTERAKT_TEMPLATE_STATUS || "booking_status_update",
        p.phone,
        params,
      );
    }
    return { sent: true, provider };
  } catch (err) {
    console.error("[whatsapp] status message failed:", err);
    return { sent: false, provider, error: String(err) };
  }
}
