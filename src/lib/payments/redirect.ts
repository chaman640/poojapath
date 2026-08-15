import "server-only";
import { NextResponse } from "next/server";
import { siteConfig } from "../env";

/**
 * Payment gateway ke callback se user ko wapas site par bhejna.
 *
 * Seedha 303 redirect kaafi nahi hai — kabhi-kabhi gateway humara page
 * apne iframe ke andar khol deta hai, aur humari CSP (`frame-ancestors 'none'`)
 * usse block kar deti hai. Tab user ko lagta hai ki kuch hua hi nahi.
 *
 * Isliye hum ek chhota HTML page bhejte hain jo:
 *   1. top-level window ko sahi jagah bhejta hai (iframe se bahar nikal kar)
 *   2. JS band ho to <meta refresh> se bhejta hai
 *   3. phir bhi na chale to ek bada button dikhata hai
 */
export function paymentRedirect(path: string, req?: Request): NextResponse {
  const url = `${resolveBase(req)}${path}`;
  const safe = url.replace(/"/g, "&quot;").replace(/</g, "&lt;");

  const html = `<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=${safe}">
<title>Redirecting…</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#FFF9F2;
       font-family:system-ui,-apple-system,"Noto Sans",sans-serif;color:#2B1810;padding:24px}
  .box{text-align:center;max-width:360px}
  .om{font-size:44px}
  h1{font-size:19px;margin:14px 0 6px;color:#7B1E1E}
  p{font-size:14px;line-height:1.6;color:#6b5a50;margin:0 0 20px}
  a{display:inline-block;background:linear-gradient(90deg,#EA580C,#F97316);color:#fff;
    text-decoration:none;font-weight:700;padding:15px 26px;border-radius:16px;font-size:16px}
  .spin{width:26px;height:26px;margin:0 auto 4px;border:3px solid #FED7AA;
        border-top-color:#EA580C;border-radius:50%;animation:s .8s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
</style>
</head>
<body>
  <div class="box">
    <div class="om">🪔</div>
    <div class="spin"></div>
    <h1>Aapki booking khul rahi hai…</h1>
    <p>Kuch hi pal me aapki booking dikhne lagegi. Agar apne aap na khule to neeche dabayein.</p>
    <a href="${safe}" id="go">Booking dekhein</a>
  </div>
<script>
  (function () {
    var u = ${JSON.stringify(url)};
    try {
      // iframe ke andar ho to top window ko bhejo, warna khud ko
      if (window.top && window.top !== window.self) { window.top.location.replace(u); }
      else { window.location.replace(u); }
    } catch (e) {
      // cross-origin iframe: link ko _top par khol do
      var a = document.getElementById("go");
      if (a) { a.target = "_top"; a.click(); }
    }
  })();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      // Ye ek page iframe me bhi render ho sake, warna JS chal hi nahi payega
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; base-uri 'self'",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}

/**
 * Base URL: pehle request ka apna host (hamesha sahi rehta hai),
 * warna .env wala NEXT_PUBLIC_SITE_URL.
 */
function resolveBase(req?: Request): string {
  if (req) {
    try {
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (host) {
        const proto =
          req.headers.get("x-forwarded-proto") ??
          (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
        return `${proto}://${host}`;
      }
    } catch {
      /* niche fallback */
    }
  }
  return siteConfig.url.replace(/\/$/, "");
}
