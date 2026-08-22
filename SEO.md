# 🔍 SEO — kya ho chuka hai, aur ab aapko kya karna hai

Ye file do hisson me hai:

1. **Code me kya lag chuka hai** — ye ho gaya, dobara nahi karna
2. **Aapko khud kya karna hai** — ye Google ke paanel me karna hoga, code se nahi hota

Sabse pehle ek zaroori sachchai, taaki mehnat sahi jagah lage.

---

## ⚠️ Pehle ye padh lein — do baatein jo SEO se **nahi** hongi

### 1. "SriMandir / Devdham / Vama ko search karne par hamara link pehle aaye"

**Ye SEO se nahi ho sakta.** Kisi bhi kaam se nahi — koi bhi developer, koi bhi agency ye nahi kar sakti.

Kyun: jab koi "SriMandir" type karta hai, wo saaf-saaf **usi company ko** dhoondh raha hai. Google ka poora kaam hi yahi hai ki use wahi mile jo wo maang raha hai. Kisi brand ke apne naam par uski hi website hamesha pehle aayegi — ye Google ka sabse pakka niyam hai.

Aur `.com`, `.in`, `.shop`, `.site` — sab par yahi laagu hai.

Isse zabardasti karne ki koshish (unke naam se page banana, unka naam apne page me bhar dena) ke do nateeje hote hain: Google **saza** deta hai (poori site neeche chali jati hai), aur trademark ka **kanooni** masla ban sakta hai. Nuksan hi nuksan.

**Jo sach me kaam karta hai:** Google Ads. Wahan aap kisi doosre brand ke naam par apna vigyapan **kanooni taur par** chala sakte hain — Google khud iski ijaazat deta hai. Koi "SriMandir" search kare, sabse upar aapka ad dikhe. Ye seedha, jaayaz aur turant chalne wala raasta hai.

> Aap ne kaha tha agle step me ads ki baat karenge — **ye kaam wahin hoga.** SEO se nahi.

### 2. "Puja, path, mandir jaise aam shabdon par pehla number"

Ye **ho sakta hai, par ek din me nahi.** Aaj aapki site nayi hai; Google use abhi jaanta hi nahi. SriMandir jaisi site 3-4 saal se hai aur uske lakhon page Google me hain.

Asli raasta ulta chalta hai — **chhote shabdon se bade shabdon ki taraf**:

| Kab | Kis tarah ke shabd | Misaal |
|---|---|---|
| 1-2 mahine | Bahut khaas | "kashi vishwanath rudrabhishek online booking" |
| 3-6 mahine | Thode aam | "rudrabhishek online booking" |
| 6-12+ mahine | Aam | "online puja booking" |

Khaas shabdon par log kam hote hain, **par wahi log booking karte hain.** Aur har jeet Google ki nazar me aapki site ko upar uthati hai. Isi liye neeche `/mandir/<naam>` wale page banaye gaye hain.

---

## ✅ Code me kya lag chuka hai

### Logo — search me link ke saath

Ye aapki maang thi aur **ho gaya hai**. Teen cheezein chahiye thi, teeno lagi hain:

- `/favicon.ico`, aur PNG 32 / 96 / 192 / 512 — sab `public/` me
- `Organization` schema me `logo` (512×512) — Google isi ko padhta hai
- `manifest.webmanifest`

> Google ko favicon dikhne me **kuch din se 2 hafte** lagte hain. Turant nahi dikhega — ye normal hai, kuch toota nahi hai.

### Structured data (JSON-LD)

Google ko machine-padhne layak bataya jata hai ki page par kya hai:

| Kahan | Kya bhejte hain | Search me kya milta hai |
|---|---|---|
| Har page | `Organization`, `WebSite` | Logo, naam, search box |
| Home | `FAQPage` | Sawal seedha result me khulte hain |
| Puja page | `Event` + `Product` + `Offer` | **Daam** aur "available" result me |
| Mandir page | `PlaceOfWorship` + `ItemList` | Jagah ke hisaab se |
| Sab jagah | `BreadcrumbList` | "Home › Pujas › ..." patti |

Daam result me dikhna sabse bada faayda hai — isse click kaafi badhte hain.

### Naye page — "mandir" wale shabdon ke liye

`/mandir` aur `/mandir/<naam>` — har mandir ka apna page, uski saari pujaon ke saath.

Log "mandir" akela nahi likhte; wo likhte hain *"ujjain mahakal mandir me puja booking"*. Aisa page pehle tha hi nahi. **Ab jitne mandir admin me add karenge, utne naye page apne aap ban jayenge.**

### Baaki

- Har page ka apna title aur description (dohraye hue nahi)
- `canonical` — Google ko "asli pata" batata hai, warna wo aapki hi site ko do jagah ginta hai
- OG image (1200×630) — WhatsApp/Facebook par link bhejne par sundar card
- `max-image-preview: large` — result me badi tasveer
- Sitemap me ab mandir aur category page bhi
- `robots.txt` — admin/API/booking/pay chhupe, AI search bots (ChatGPT, Perplexity) khule

---

## 📋 Ab aapko kya karna hai

Ye **code se nahi hota** — aapko khud karna padega. Isके bina upar ka poora kaam bekaar hai, kyunki Google ko pata hi nahi chalega ki aapki site hai.

### 1. Google Search Console — sabse zaroori (15 minute)

1. https://search.google.com/search-console kholiye
2. **URL prefix** chuniye → `https://anusthanpooja.site`
3. Verification me **HTML tag** wala tareeka chuniye, code copy kariye
4. Render → apni service → **Environment** → naya variable:
   - Key: `NEXT_PUBLIC_GOOGLE_VERIFICATION`
   - Value: sirf `content="..."` ke andar wala code (poora tag nahi)
5. Save → deploy hone dijiye → Search Console me **Verify** dabayiye
6. Verify hote hi **Sitemaps** me jaakar `sitemap.xml` daal dijiye
7. **URL Inspection** me home page ka pata daaliye → **Request Indexing**

Yahi 15 minute sabse zyada asar karte hain.

### 2. Google Business Profile (30 minute)

https://business.google.com — apna business banayiye. Isse:

- Google ke daayein taraf aapka **panel** ban jata hai (logo, photo, review ke saath)
- Map aur local search me aana shuru hota hai
- Naye brand ke liye ye bharose ka sabse bada zariya hai

### 3. Har mandir ka `about` bhariye — ye sabse bada fark laayega

Admin panel me har mandir ka **About** khali na chhodein. Kam se kam **150-200 shabd** likhiye, aur usme ye zaroor aaye:

- Mandir ka naam Hindi **aur** English dono me
- Shahar aur rajya
- Kaun se devta, kya mahatva
- Wahan kaun si puja hoti hai

Google ko padhne ke liye content chahiye. Khali page kabhi upar nahi aata. **Yahi ek kaam sabse zyada asar karega.**

Yahi baat puja ke `description` par bhi laagu hai — jitna vistaar se likhenge, utna behtar.

### 4. Content — asli lambi race

Har hafte 1-2 lekh. Vishay wahi jo log dhoondhte hain:

- "Rudrabhishek kya hota hai aur kab karana chahiye"
- "Kaal Sarp Dosh ke lakshan aur upay"
- "Pitru Paksha me shraddh kaise karein"

Ye lekh un logon ko laate hain jo abhi khareedne nahi aaye — par baad me wahi grahak bante hain. SriMandir ne yahi kiya hai.

### 5. Bing bhi (5 minute)

https://www.bing.com/webmasters — Search Console se seedha import ho jata hai. ChatGPT ka search Bing par chalta hai, isliye ab ye maayne rakhta hai.

---

## ⏱️ Kya kab dikhega — sach-sach

| Kab | Kya |
|---|---|
| 2-7 din | Site Google me aane lagegi (`site:anusthanpooja.site` se dekh sakte hain) |
| 1-2 hafte | Logo search me dikhne lagega |
| 3-6 hafte | Khaas shabdon par aana shuru |
| 3-6 mahine | Thode aam shabdon par |
| 6-12 mahine | Aam shabdon par takkar |

Jo bhi kahe "ek hafte me pehla number", wo jhooth bol raha hai.

---

## 🔧 Jaanchne ke liye

| Cheez | Kahan |
|---|---|
| Structured data sahi hai? | https://search.google.com/test/rich-results |
| Site kitni Google me hai? | Google me `site:anusthanpooja.site` |
| Speed | https://pagespeed.web.dev |
| Sitemap | `anusthanpooja.site/sitemap.xml` |
| robots | `anusthanpooja.site/robots.txt` |
| WhatsApp card | Kisi ko link bhej kar dekh lein |

---

# 📊 Meta Pixel — Facebook / Instagram ads ke liye

Pixel lag chuka hai. Bas **ID daalni baaki hai** — uske bina wo poori tarah band rehta hai (na script load hoti hai, na koi request jati hai).

## ID kahan se milegi (5 minute)

1. https://business.facebook.com/events_manager kholiye
2. **Connect data sources → Web → Connect**
3. Pixel ka naam: `Anusthan Pooja`
4. Website: `https://anusthanpooja.site`
5. Ban jaane par upar **15-16 digit ka number** dikhega — wahi ID hai, copy kar lijiye

## Render me daalna

Render → apni service → **Environment** → Add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_META_PIXEL_ID` | wahi number |

Save → deploy hone dijiye. Bas.

## Jaanchne ke liye

Chrome me **Meta Pixel Helper** extension lagayiye, phir site kholiye. Neela icon hara ho jaye aur `PageView` dikhe — Pixel chal raha hai.

## Kaun se event apne aap jate hain

| Kab | Event | Kya bhejta hai |
|---|---|---|
| Koi bhi page khule | `PageView` | — |
| Puja ka page khule | `ViewContent` | puja ka naam, daam |
| "अभी भुगतान करें" daba | `InitiateCheckout` | raashi |
| Booking confirm ho | `Purchase` | raashi, puja ka naam |

`Purchase` har booking par **sirf ek baar** jata hai — page refresh karne par dobara nahi. Warna Ads Manager me nakli bikri dikhne lagti hai aur Meta usi galat data par optimize karta rehta hai.

**Grahak ki niji jaankari kabhi nahi jati** — naam, number, gotra, pata, booking code: kuch bhi nahi. Sirf itna ki "kisi ne puja dekhi", "kisi ne ₹201 diya".

## Pixel ka asli faayda kab milega

Aaj nahi — **kal**. Abhi wo chup-chaap data jama kar raha hai. Jab 50-100 booking ho jayengi, tab Meta ke paas ye samajhne layak data hoga ki aapka kharidaar kaisa dikhta hai, aur wo khud waise log dhoondhne lagega (Lookalike Audience). Wahan se ad ka kharch aadha ho jata hai.

**Isliye ID aaj hi daal dijiye**, chahe ad agle mahine chalayein. Jitna purana data, utna behtar.
