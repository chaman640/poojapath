import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * Paytm Payment Gateway — checksum + API calls.
 *
 * Koi SDK nahi: Paytm ka official checksum algorithm yahan seedha
 * Node crypto se likha hai (AES-128-CBC + SHA-256), taaki koi extra
 * dependency aur uska security risk na rahe.
 *
 * Merchant Key kabhi browser tak nahi jaati — sab kuch server par.
 */

const IV = "@@@@&&&&####$$$$";
const SALT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function isPaytmLive(): boolean {
  return Boolean(process.env.PAYTM_MID?.trim() && process.env.PAYTM_MERCHANT_KEY?.trim());
}

function host(): string {
  return process.env.PAYTM_ENV?.trim() === "test"
    ? "https://securegw-stage.paytm.in"
    : "https://securegw.paytm.in";
}

export function paytmCheckoutScript(): string {
  const mid = process.env.PAYTM_MID!;
  return `${host()}/merchantpgpui/checkoutjs/merchants/${mid}.js`;
}

/* ------------------------------------------------------------------ */
/*  Checksum                                                           */
/* ------------------------------------------------------------------ */

function merchantKey(): Buffer {
  const key = process.env.PAYTM_MERCHANT_KEY ?? "";
  return Buffer.from(key, "utf8");
}

function randomSalt(len = 4): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += SALT_CHARS[bytes[i] % SALT_CHARS.length];
  return out;
}

function encrypt(input: string): string {
  const cipher = createCipheriv("aes-128-cbc", merchantKey(), IV);
  return cipher.update(input, "binary", "base64") + cipher.final("base64");
}

function decrypt(input: string): string {
  const decipher = createDecipheriv("aes-128-cbc", merchantKey(), IV);
  return decipher.update(input, "base64", "binary") + decipher.final("binary");
}

function hashWithSalt(payload: string, salt: string): string {
  return createHash("sha256").update(`${payload}|${salt}`).digest("hex");
}

/** Object ko Paytm ke tareeke se string me badalta hai (keys sorted, pipe se juda) */
function paramsToString(params: Record<string, unknown>): string {
  return Object.keys(params)
    .sort()
    .map((k) => {
      const v = params[k];
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.toLowerCase() === "null" ? "" : s;
    })
    .join("|");
}

export function generateSignature(payload: string | Record<string, unknown>): string {
  const asString = typeof payload === "string" ? payload : paramsToString(payload);
  const salt = randomSalt();
  return encrypt(hashWithSalt(asString, salt) + salt);
}

export function verifySignature(
  payload: string | Record<string, unknown>,
  checksum: string,
): boolean {
  try {
    if (!checksum) return false;

    let asString: string;
    if (typeof payload === "string") {
      asString = payload;
    } else {
      const copy = { ...payload };
      delete copy.CHECKSUMHASH;
      asString = paramsToString(copy);
    }

    const decrypted = decrypt(checksum);
    const salt = decrypted.slice(-4);
    const expected = hashWithSalt(asString, salt) + salt;

    const a = Buffer.from(decrypted, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  API calls                                                          */
/* ------------------------------------------------------------------ */

async function postToPaytm(url: string, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, never>;
    } catch {
      throw new Error(`Paytm ne galat jawab bheja: ${text.slice(0, 200)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

export type PaytmSession = {
  mid: string;
  orderId: string;
  txnToken: string;
  amount: string;
  scriptUrl: string;
};

/**
 * Transaction shuru karo — Paytm se txnToken laata hai,
 * jise browser me CheckoutJS kholne ke liye use karte hain.
 */
export async function initiateTransaction(params: {
  orderId: string;
  amountInPaise: number;
  customerId: string;
  callbackUrl: string;
}): Promise<PaytmSession> {
  if (!isPaytmLive()) throw new Error("Paytm keys .env me set nahi hain.");

  const mid = process.env.PAYTM_MID!;
  const website = process.env.PAYTM_WEBSITE?.trim() || "DEFAULT";
  const amount = (params.amountInPaise / 100).toFixed(2);

  const body = {
    requestType: "Payment",
    mid,
    websiteName: website,
    orderId: params.orderId,
    callbackUrl: params.callbackUrl,
    txnAmount: { value: amount, currency: "INR" },
    userInfo: { custId: params.customerId },
  };

  const signature = generateSignature(JSON.stringify(body));

  const url = `${host()}/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(
    mid,
  )}&orderId=${encodeURIComponent(params.orderId)}`;

  const json = (await postToPaytm(url, { body, head: { signature } })) as unknown as {
    body?: {
      txnToken?: string;
      resultInfo?: { resultStatus?: string; resultCode?: string; resultMsg?: string };
    };
  };

  const token = json.body?.txnToken;
  const info = json.body?.resultInfo;

  if (!token) {
    throw new Error(
      `Paytm initiate fail: ${info?.resultCode ?? "?"} ${info?.resultMsg ?? "unknown"}`,
    );
  }

  return {
    mid,
    orderId: params.orderId,
    txnToken: token,
    amount,
    scriptUrl: paytmCheckoutScript(),
  };
}

export type PaytmStatus = {
  success: boolean;
  pending: boolean;
  txnId: string | null;
  amountInPaise: number | null;
  resultStatus: string;
  resultMsg: string;
};

/**
 * Payment ki asli sthiti Paytm ke server se poochho.
 * Browser se aayi kisi bhi jaankari par bharosa nahi karte —
 * paisa aaya ya nahi, iska faisla sirf isi API se hota hai.
 */
export async function fetchTransactionStatus(orderId: string): Promise<PaytmStatus> {
  if (!isPaytmLive()) throw new Error("Paytm keys .env me set nahi hain.");

  const mid = process.env.PAYTM_MID!;
  const body = { mid, orderId };
  const signature = generateSignature(JSON.stringify(body));

  const json = (await postToPaytm(`${host()}/v3/order/status`, {
    body,
    head: { signature },
  })) as unknown as {
    body?: {
      resultInfo?: { resultStatus?: string; resultMsg?: string };
      txnId?: string;
      txnAmount?: string;
    };
  };

  const status = json.body?.resultInfo?.resultStatus ?? "UNKNOWN";
  const amount = json.body?.txnAmount ? Math.round(Number(json.body.txnAmount) * 100) : null;

  return {
    success: status === "TXN_SUCCESS",
    pending: status === "PENDING",
    txnId: json.body?.txnId ?? null,
    amountInPaise: Number.isFinite(amount) ? amount : null,
    resultStatus: status,
    resultMsg: json.body?.resultInfo?.resultMsg ?? "",
  };
}
