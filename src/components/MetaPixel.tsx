"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { pixelId, pixelOn } from "@/lib/pixel";

/**
 * Meta Pixel ka base script + har page par PageView.
 *
 * Ek baat khaas: Next.js me page badalne par browser dobara load nahi
 * hota — sirf content badalta hai. Isliye Meta ka apna PageView sirf
 * pehli baar chalta hai. Yahan hum khud raasta badalne par PageView
 * bhejte hain, warna aadha traffic Ads Manager me dikhta hi nahi.
 */
function PixelInner() {
  const id = pixelId();
  const pathname = usePathname();
  const search = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    // Pehla PageView base script khud bhejta hai — dobara mat bhejo
    if (first.current) {
      first.current = false;
      return;
    }
    if (typeof window !== "undefined" && window.fbq) {
      try {
        window.fbq("track", "PageView");
      } catch {
        /* ignore */
      }
    }
  }, [pathname, search]);

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');
fbq('track','PageView');`}
    </Script>
  );
}

export default function MetaPixel() {
  // Pixel ID set nahi hai to kuch bhi load mat karo
  if (!pixelOn()) return null;
  return <PixelInner />;
}
