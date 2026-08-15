"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Jab booking "payment pending" me atki ho, ye chup-chaap page ko
 * bar-bar refresh karta hai. Har refresh par server Razorpay se
 * poochhta hai ki paisa aaya ya nahi — jaise hi jawab "haan" aata hai,
 * page apne aap confirm dikhane lagta hai.
 *
 * User ko kuch karna nahi padta — na refresh, na wapas aana.
 * Do minute baad ye khud ruk jata hai taaki phone ki battery na jaye.
 */
export default function PendingPaymentWatcher({
  attempts = 20,
  everyMs = 6000,
}: {
  attempts?: number;
  everyMs?: number;
}) {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= attempts) return;

    const id = setTimeout(() => {
      // tab background me ho to gateway ko na pitein
      if (document.visibilityState === "visible") router.refresh();
      setTries((n) => n + 1);
    }, everyMs);

    return () => clearTimeout(id);
  }, [tries, attempts, everyMs, router]);

  return null;
}
