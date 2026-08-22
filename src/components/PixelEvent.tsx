"use client";

import { useEffect } from "react";
import { track, trackOnce } from "@/lib/pixel";

/**
 * Ek event bhejne wala chhota component — screen par kuch nahi dikhata.
 *
 * Server page bas itna kehta hai "ye hua", aur ye browser me jaakar Meta
 * ko bata deta hai. Isse server component ko client banane ki zaroorat
 * nahi padti.
 *
 * `once` de dein (jaise booking code) to wo event us cheez ke liye
 * zindagi me ek hi baar jayega — refresh karne par bhi nahi.
 */
export default function PixelEvent({
  event,
  once,
  value,
  currency = "INR",
  contentName,
  contentIds,
  contentType = "product",
}: {
  event: "ViewContent" | "InitiateCheckout" | "Purchase" | "Lead" | "Contact";
  once?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
  contentType?: string;
}) {
  useEffect(() => {
    const params: Record<string, string | number | string[]> = {};
    if (typeof value === "number") {
      params.value = value;
      params.currency = currency;
    }
    if (contentName) params.content_name = contentName;
    if (contentIds?.length) {
      params.content_ids = contentIds;
      params.content_type = contentType;
    }

    if (once) trackOnce(once, event, params);
    else track(event, params);
  }, [event, once, value, currency, contentName, contentIds, contentType]);

  return null;
}
