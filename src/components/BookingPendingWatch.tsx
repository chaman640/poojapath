"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Booking page par payment pending ho to chup-chaap dekhte rehna.
 *
 * Har 6 second page ko taaza kar dete hain. Har refresh par server
 * Razorpay se seedha poochhta hai (reconcile), isliye paisa pahunchte hi
 * page apne aap "confirm" dikhane lagta hai — aur WhatsApp bhi khul jata
 * hai. Grahak ko kuch dabana nahi padta.
 *
 * Do hadein rakhi hain taaki ye hamesha na chalta rahe:
 *   • 40 baar (~4 minute) ke baad ruk jata hai
 *   • page peechhe (dusre tab me) chala jaye to nahi chalta
 */
export default function BookingPendingWatch({ tries = 40 }: { tries?: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(tries);

  useEffect(() => {
    if (left <= 0) return;

    const id = setTimeout(() => {
      if (document.visibilityState === "visible") router.refresh();
      setLeft((n) => n - 1);
    }, 6000);

    return () => clearTimeout(id);
  }, [left, router]);

  return null;
}
