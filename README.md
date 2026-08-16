# 🪔 Pooja Path

Online puja booking website — Bhaktimay jaisa, lekin poora apna code, apna design aur apna content.

**Khaas baat:** koi login/password nahi. Devotee sirf **naam, gotra aur mobile number** bharta hai — saari update usi number par WhatsApp se chali jaati hai.

---

## Isme kya-kya hai

**Website (public)**

- Homepage — hero, trust bar, aane wali pujaayein, "kaise kaam karta hai", chadhava, testimonials, FAQ
- Upcoming Pujas — search + category filter
- Puja detail page — asli photo, laabh, vidhi, mandir ki jaankari
- **Step-by-step booking wizard** (mobile-first) — 4 aasan steps:
  1. Kitne logon ka → 2. Kuch extra chahiye (add-ons) → 3. Naam, gotra, number → 4. Pata + payment
  Bade buttons, neeche hamesha total dikhta hai, koi login nahi
- **Add-ons** — prasad ghar par, rudraksh mala, deepdaan, annadaan… tap karke jodo.
  Sirf "ghar bhejne wale" add-on chunne par hi pata maanga jata hai, warna bilkul nahi
- **Razorpay** payment (UPI, card, netbanking) — Paytm par switch karna ho to bhi tayyar
- Services & Pricing page (`/pricing`) — payment gateway KYC ke liye
- Booking status page + **"Track Booking" sirf mobile number se** — saari pujaayein list me
- Booking page par **"Send on WhatsApp"** — ek tap me poori booking admin ke WhatsApp par
- Chadhava (offerings) aur Divine Store (products)
- About, Contact (form ke saath), Privacy / Terms / Refund / Shipping
- **Hindi ⇄ English toggle** — poori site, ek click me

**Admin panel** (`/admin`)

- Secure login (bcrypt + JWT cookie + account lockout)
- Dashboard — bookings, revenue, pending payments
- Bookings — search, filter, status update, video link, prasad tracking, add-ons ki list
- Puja add/edit — **photo upload**, dono bhasha me content, packages, aur kaunse add-ons dikhein
- **Add-ons manager** — naam, photo, price, description aur prakaar (ghar bhejna / mandir seva)
- Contact messages
- Settings — environment status + password change

---

## Technology (aur kyun)

| Cheez | Kya | Kyun |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Fast, SEO-friendly, ek hi project me frontend + backend |
| Language | TypeScript | Galtiyan likhte waqt hi pakdi jaati hain |
| Styling | Tailwind CSS | Poora design custom, koi bhaari UI library nahi |
| Database | **PostgreSQL** + Drizzle ORM | Reliable; saari queries parameterised (SQL injection se surakshit) |
| Payment | **Razorpay** (Paytm bhi supported) | `.env` me ek line badal kar switch kar sakte hain |
| Photos | **Cloudinary** | Free 25GB; photos apne aap WebP me convert hoti hain |
| WhatsApp | AiSensy ya Interakt | `.env` me key daalte hi chalu |
| Hosting | **Render** | Free tier, auto HTTPS, ek click deploy |

`npm audit` par abhi **0 vulnerabilities** hain. Koi image/font local nahi — saari artwork SVG me code se banti hai, isliye site halki hai aur kisi ki copyright chori nahi.

---

## Security — kya-kya kiya gaya hai

| Khatra | Bachaav |
|---|---|
| SQL injection | Drizzle ORM — har query parameterised, kahin string joining nahi |
| XSS | React auto-escaping + input me `<` `>` block + JSON-LD escape + `javascript:` links block |
| CSRF | Cookie `SameSite=Lax` + har POST par Origin verify + Server Actions ka built-in check |
| Password chori | bcrypt (12 rounds), plain password kahin store nahi |
| Brute force login | 6 galat koshish → account 30 min lock; IP par bhi rate limit |
| Session hijack | JWT `httpOnly` + `Secure` cookie, 8 ghante me expire, `tokenVersion` se turant invalidate |
| Admin bypass | Auth **har page aur har action me** server-side check hota hai — middleware par bharosa nahi (wo bypass ho sakta hai) |
| Payment tampering | Amount hamesha database se, kabhi browser se nahi; Razorpay HMAC signature verify + server-to-server payment fetch se confirm |
| Redirect toot-na | Payment ke baad Razorpay seedha server par callback karta hai (`/api/payment/razorpay/callback`) — mobile/UPI par bhi redirect pakka |
| Paisa kata par booking pending | **Reconcile** — pending booking khulte hi server khud gateway se poochhta hai ki paisa aaya ya nahi, aur haan hone par booking apne aap confirm ho jati hai. Callback aur webhook dono fail ho jayein tab bhi paisa kabhi "gum" nahi hota |
| Fake webhook | `x-razorpay-signature` HMAC verify (Paytm ke liye CHECKSUMHASH) — bina sahi signature ke reject |
| Spam bookings/messages | IP rate limiting + contact form me honeypot |
| Booking ID guessing | Track page par 10 min me 8 koshish, phir 20 min block; list me sirf puja/tithi/status — naam, gotra, pata nahi |
| Clickjacking | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| Data leak | IP plain me store nahi (sirf hash); admin pages `noindex` + `no-store` |
| Secrets | Sab `.env` me, `.gitignore` me — code me kahin hardcode nahi |

Security headers (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy) `next.config.ts` me set hain.

---

## Local par chalane ke liye

```bash
# 1. Dependencies
npm install

# 2. Environment file
cp .env.example .env
#    .env kholein aur DATABASE_URL + AUTH_SECRET bhar dein

# 3. Database tables banayein
npm run db:migrate

# 4. Demo content daalein (pujas, temples, testimonials, admin user)
npm run db:seed

# 5. Chalu karein
npm run dev
```

Site: <http://localhost:3000> • Admin: <http://localhost:3000/admin>

AUTH_SECRET banane ke liye:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## Render par deploy (step by step)

### Tarika 1 — Blueprint (sabse aasan)

1. Project GitHub par push karein
2. Render → **New +** → **Blueprint** → apna repo chunein
3. Render `render.yaml` padh kar database aur web service dono bana dega
4. `ADMIN_PASSWORD` maanga jayega — ek strong password dein
5. Deploy hone ke baad **Environment** tab me `NEXT_PUBLIC_SITE_URL` apne asli domain par set karein

### Tarika 2 — Manually

1. **Database banayein:** Render → New + → PostgreSQL → naam `pooja-path-db`, plan Free, region **Singapore**. Ban jaane par **Internal Database URL** copy kar lein.

2. **Web service banayein:** New + → Web Service → apna repo → settings:

   | Field | Value |
   |---|---|
   | Runtime | Node |
   | Build Command | `npm ci && npm run db:migrate && npm run db:seed && npm run build` |
   | Start Command | `npm start` |
   | Health Check Path | `/` |

3. **Environment variables** (Environment tab me):

   ```
   DATABASE_URL              = (upar wala Internal Database URL)
   AUTH_SECRET               = (48 byte random — upar wali command se)
   NEXT_PUBLIC_SITE_URL      = https://aapka-domain.com
   NEXT_PUBLIC_SITE_NAME     = Pooja Path
   NEXT_PUBLIC_SUPPORT_PHONE = +91XXXXXXXXXX
   NEXT_PUBLIC_SUPPORT_WHATSAPP = +91XXXXXXXXXX
   NEXT_PUBLIC_SUPPORT_EMAIL = support@aapka-domain.com
   ADMIN_EMAIL               = aap@example.com
   ADMIN_PASSWORD            = (strong password — pehli baar login ke liye)
   NODE_VERSION              = 22
   ```

4. **Deploy** dabayein. Pehla build ~3-5 minute lega.

5. **Domain lagayein:** Settings → Custom Domain → apna domain add karke DNS me CNAME point kar dein. HTTPS Render khud laga deta hai.

> **Free plan ka dhyaan rakhein:** free web service 15 minute inactivity ke baad so jaati hai (agli request 30-50 sec leti hai), aur free database 30 din baad expire hota hai. Asli traffic aane par paid plan (~$7/month) le lena.

---

## Razorpay payment gateway chalu karna

Site **Razorpay** ke liye tayyar hai. Jab tak keys nahi hain, "Demo Mode" me chalti hai —
booking ban jati hai par paisa nahi katta.

### 1. Razorpay account

[razorpay.com](https://razorpay.com) par account banayein aur KYC poori karein
(PAN, bank account, business proof). Dashboard → **Settings → API Keys → Generate Key**
se do cheezein milengi:

- **Key ID** (`rzp_test_...` ya `rzp_live_...`)
- **Key Secret**

### 2. Webhook banayein

Dashboard → **Settings → Webhooks → Add New Webhook**

| Field | Value |
|---|---|
| Webhook URL | `https://aapka-domain.com/api/payment/webhook` |
| Secret | koi bhi random string (yahi neeche `.env` me bhi daalein) |
| Active Events | `payment.captured`, `payment.failed`, `order.paid` |

### 3. Render → Environment me bharein

```
PAYMENT_PROVIDER        = razorpay
RAZORPAY_KEY_ID         = rzp_test_xxxxxxxx   (live ke liye rzp_live_...)
RAZORPAY_KEY_SECRET     = xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET = webhook wala secret
```

**Redeploy** karein — payment live ho jayega. Admin → Dashboard par green banner
"✓ Payment gateway chalu hai (razorpay)" dikhne lagega.

> **Pehle test karein:** `rzp_test_` keys se ek booking karke dekh lein. Razorpay test mode
> me UPI/card sab dummy chalte hain, asli paisa nahi katta. Sab theek lage to
> `rzp_live_` keys daal kar redeploy karein.

### Security — Razorpay ke saath kya-kya hota hai

- Amount hamesha database se jata hai, browser se kabhi nahi
- Checkout ke baad browser jo signature bhejta hai wo **HMAC-SHA256** se verify hota hai
- Uske baad bhi bharosa nahi — **Razorpay ke server se seedha payment fetch** karke
  status aur amount dono match karte hain, tabhi booking confirm hoti hai
- Webhook par `x-razorpay-signature` verify hota hai — bina sahi signature ke reject
- Booking dobara confirm nahi hoti (webhook aur browser dono aayein tab bhi ek hi baar)
- Key Secret sirf server par rehta hai, browser tak kabhi nahi jaata

### 🔴 "Payment ho gaya par booking pending dikh rahi hai"

Ye sabse zaroori hissa hai — ek baar dhyaan se padh lein.

Booking confirm hone ke **chaar** raaste hain. Shuru ke do toot sakte hain, baaki do hamesha chalte hain:

| # | Raasta | Kab toot jata hai |
|---|---|---|
| 1 | **Browser callback** — Razorpay khud user ko `/api/payment/razorpay/callback` par bhejta hai | **Ye tabhi chalta hai jab aapka domain Razorpay account me "Website and app details" me darj ho.** Darj na ho to Razorpay chup-chaap payment window band kar deta hai — paisa kat jata hai aur website ko khabar hi nahi hoti. Isi wajah se ye raasta ab checkout me maanga hi nahi jata (route mojood hai, domain darj karwate hi apne aap kaam karega). |
| 2 | **Webhook** — Razorpay khud humare server ko batata hai | Dashboard me webhook register na kiya ho, ya `RAZORPAY_WEBHOOK_SECRET` match na kare |
| 3 | **Checkout handler** — payment poora hote hi browser khud `/api/payment/verify` par bata deta hai | Sirf tab jab browser tab hi band ho jaye (mobile par UPI app se wapas hi na aayein) |
| 4 | **Reconcile** — hum khud Razorpay se poochhte hain | Kabhi nahi — jab bhi koi pending booking khulti hai, ye apne aap chalta hai |

**Raasta 3 aur 4 milkar "kuch hua hi nahi" wali dikkat khatam kar dete hain.**
Payment window band hote hi browser har kuch second me
`/api/bookings/status?code=PP-...` poochhta rehta hai (~30 second tak), aur wo
route har baar Razorpay se seedha confirm karta hai. Paisa milte hi browser
khud booking page khol deta hai — aur wahan WhatsApp apne aap khul jata hai.
Booking code `sessionStorage` me bhi rakha jata hai, isliye UPI app se wapas
aane par page dobara load ho jaye tab bhi jaanch chalti rehti hai.

> Screen par "⏳ आपका भुगतान जाँचा जा रहा है…" dikhe to yahi chal raha hai.
> Agar sach me payment nahi kiya to "मैंने भुगतान नहीं किया" daba dein.

**Raasta 3 (reconcile) apne aap in teen jagah chalta hai:**

- Booking page (`/booking/PP-...`) khulte hi — aur page chup-chaap refresh hota rehta hai, jaise hi paisa mila booking confirm dikhne lagti hai
- Track page par number daalte hi — us number ki saari pending bookings check ho jati hain
- **Admin → Payments** — saari pending bookings ek saath, aur har ek ke saamne likha hota hai ki Razorpay kya keh raha hai

Isliye agar kabhi "payment ho gaya par pending dikh raha hai" jaisa lage, to **Admin → Payments** khol lein. Jinka paisa aa chuka hoga wo wahin confirm ho jayengi.

#### Sabse pakka rasta — Razorpay ki taraf se milaan

Admin → Payments page par upar hi ek hissa hai: **"Razorpay par aayi payments"**.
Ye humari bookings se shuru nahi karta, seedha Razorpay se poochhta hai
*"tumhare paas kya-kya aaya hai?"* — aur phir har payment ko uski booking se
jodta hai. Booking dhoondne ke teen raaste hain, ek fail ho to doosra:

1. booking par save ki hui order id
2. order ka `receipt` (usme humne bookingCode hi bhara tha)
3. order ke `notes.bookingCode`

Isliye agar kisi booking par order id save hi na hui ho, tab bhi paisa apni
booking tak pahunch jata hai. Jis payment ka paisa aa chuka hai par booking
pending hai, uske saamne **"Jodein aur confirm karein"** button aa jata hai —
ya upar se ek baar me sabko confirm kar dein.

Agar kabhi list me koi payment na dikhe, to Razorpay Dashboard → Payments se
**Payment ID (pay_XXXX)** copy karke neeche wale box me paste kar dein. Hum
Razorpay se status aur raashi khud poochh kar booking confirm kar denge.

#### Admin → Payments page kya batata hai

| Nishaan | Matlab | Kya karna hai |
|---|---|---|
| ✓ Abhi confirm hui | Paisa pehle hi aa chuka tha, humne confirm kar diya | Kuch nahi |
| ◦ Payment hui hi nahi | User ne window band kar di, paisa nahi kata | Kuch nahi |
| ⏳ Bank ka jawab baaki | UPI/netbanking me 2-10 min lag sakte hain | Thodi der baad dobara dekhein |
| ✕ Payment fail hui | Bank ne mana kiya, paisa nahi kata | Kuch nahi |
| ⚠️ Raashi alag hai | Paisa aaya par amount match nahi | Khud dekhein, phir "Haath se paid mark karein" |
| ⚠️ Gateway se baat nahi hui | Keys galat hain ya Razorpay down hai | Setup wala hissa upar dekhein |

Ek **"Haath se paid mark karein"** button bhi hai — sirf tab use karein jab aapko bank statement se pakka pata ho ki paisa aaya hai.

#### Webhook zaroor lagayein (suraksha-jaal)

Reconcile hone ke baad bhi webhook lagana chahiye — isse booking **turant** confirm hoti hai, kisi ke page kholne ka intezaar nahi karna padta.

Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**

```
URL     : https://aapka-domain.com/api/payment/webhook      ← poora path zaroori hai
Secret  : koi bhi random string                              ← khaali mat chhodein
Events  : payment.captured, payment.failed, order.paid
```

⚠️ **Sabse aam galti:** URL me sirf domain (`https://aapka-domain.com`) ya
`/admin` daal dena. Aisa karne par webhook kabhi nahi chalega — poora
`/api/payment/webhook` likhna zaroori hai.

Sahi URL hai ya nahi, ye browser me kholkar jaanch sakte hain — sahi hoga to
ek chhota sa JSON message dikhega ("Yehi sahi webhook URL hai…"), 404 nahi.

**Secret khaali mat chhodein** — bina secret ke Razorpay signature nahi bhejta
aur humara server surakshit rehne ke liye aisi request reject kar deta hai.

Admin → Payments page par **"Webhook aaya ya nahi"** likha rehta hai — wahin se
pata chal jayega ki webhook sach me pahunch raha hai ya nahi.

Wahi secret Render → Environment me `RAZORPAY_WEBHOOK_SECRET` me bhi daalein aur redeploy karein.
Admin → Payments page upar hi bata dega ki secret set hua ya nahi.

#### Callback ke liye domain whitelist

Naye Razorpay account me `callback_url` tabhi chalta hai jab uska domain aapke account me
registered ho. Razorpay Dashboard → **Account & Settings → Website and app details** me
apna domain (`https://anusthanpooja.site`) zaroor daal dein.

#### Test key par UPI kaam nahi karta

`rzp_test_` key par mobile me UPI app nahi khulta — **"Can't open payment app"** dikhta hai.
Ye normal hai. Asli bookings ke liye `rzp_live_` key hi chahiye. Admin → Payments page
upar hi bata deta hai ki abhi TEST mode hai ya LIVE.

---

### Paytm par switch karna ho to

`.env` me itna hi:

```
PAYMENT_PROVIDER   = paytm
PAYTM_MID          = ...
PAYTM_MERCHANT_KEY = ...
PAYTM_WEBSITE      = DEFAULT
PAYTM_ENV          = production
```

Paytm ka poora code bhi maujood hai (callback URL: `/api/payment/paytm/callback`) —
kuch aur badalne ki zaroorat nahi.

---

## Payment gateway KYC ke liye zaroori pages

Razorpay/Paytm approval ke waqt ye pages maangte hain — **sab pehle se bane hue hain**:

| Page | Link |
|---|---|
| Privacy Policy | `/legal/privacy` |
| Terms & Conditions | `/legal/terms` |
| Refund & Cancellation | `/legal/refund` |
| Shipping & Delivery | `/legal/shipping` |
| Services & Pricing | `/pricing` |
| Contact Us | `/contact` |
| About Us | `/about` |

Ek cheez **aapko bharni hai** — business ka naam aur pura pata. Ye Contact page,
Legal pages aur footer me dikhta hai, aur KYC me maanga jata hai:

```
NEXT_PUBLIC_BUSINESS_NAME    = Pooja Path
NEXT_PUBLIC_BUSINESS_ADDRESS = Makan no., Gali, Sheher, Rajya - Pincode
NEXT_PUBLIC_GSTIN            = (agar hai to)
```

Admin → Settings me dikh jayega ki ye set hua ya nahi.

---

## Photo upload (Cloudinary)

Render ki disk par photos nahi rakh sakte — har deploy par mit jaati hain. Isliye photos
Cloudinary par jaati hain (free 25 GB).

Render → Environment me ye teen daal dein (Cloudinary dashboard se):

```
CLOUDINARY_CLOUD_NAME = drbsogdpu
CLOUDINARY_API_KEY    = 3566xxxxxxxxxxx
CLOUDINARY_API_SECRET = rFp3xxxxxxxxxxxxxxxx
```

Bas — ab Admin → Pujas / Add-ons me “Photo chunein” dabakar seedha upload kar sakte hain.
API secret sirf server par rehta hai, browser tak kabhi nahi jaata.

Photo na daalein to site apne aap sundar SVG artwork dikha degi — kuch toota hua nahi lagega.
Agar kabhi Cloudinary use na karna ho to “Ya link paste karein” se koi bhi https photo link
daal sakte hain.

---

## Add-ons kaise kaam karte hain

1. **Admin → Add-ons → + Naya add-on** — naam (Hindi+English), photo, keemat, description
2. **Prakaar chunein:**
   - 📦 **Ghar bhejna hai** — prasad, mala, yantra. User ye chunta hai to booking me
     **pata bharna zaroori** ho jata hai (pincode ke saath)
   - 🛕 **Mandir me hi seva** — deepdaan, annadaan, gau seva. Pata nahi maanga jata
3. **Admin → Pujas → koi puja kholein** — neeche “Is puja me kaunse add-ons dikhein”
   me tick kar dein
4. User ko booking ke **step 2** par ye dikhenge — tap karke jodte hain, total apne aap
   badh jata hai

Add-on ka daam badalne par purani bookings ka record nahi badalta — usme wahi price
save rehti hai jo booking ke waqt thi.

---

## WhatsApp updates chalu karna

**AiSensy** (`aisensy.com`) ya **Interakt** (`interakt.ai`) — dono me se koi ek. Dono par WhatsApp Business API account chahiye (~₹999/month se).

1. Provider par 2 template approve karwayein:
   - `booking_confirmed` — 6 variables: naam, booking ID, puja, tithi, amount, link
   - `booking_status_update` — 5 variables: naam, booking ID, status, detail, link
2. Render Environment me:
   ```
   WHATSAPP_PROVIDER = aisensy
   AISENSY_API_KEY   = xxxxxxxx
   ```
   (ya `interakt` + `INTERAKT_API_KEY`)
3. Redeploy — bas.

Jab tak key nahi hai, message server log me print hote hain (`[whatsapp:demo] ...`) — site normal chalti rahti hai.

---

## Roz ka kaam (admin panel)

| Kaam | Kahan |
|---|---|
| Nayi puja daalna | Admin → Pujas → **+ Nayi puja add karein** |
| Naya mandir jodna | Puja form me mandir ka naam **type kar dein** — naya mandir apne aap ban jayega |
| Naya puja type (category) | Waise hi — category box me naya naam type kar dein |
| Puja ki photo lagana | Puja kholein → upar **Photo chunein** |
| Naya add-on banana | Admin → Add-ons → **+ Naya add-on** |
| Puja me add-ons lagana | Puja kholein → neeche checkbox tick karein |
| Puja delete karna | Pujas list → **Delete**. Booking wali puja ke liye **Delete + bookings** (dobara confirm maangta hai) |
| Puja chhupana/dikhana | Pujas list me **Live / Hidden** button |
| Booking dekhna | Admin → Bookings (search: ID, naam, phone) |
| Video bhejna | Booking kholein → status **Video shared** + link daalein → Update |
| Prasad tracking | Status **Prasad dispatched** + tracking number → Update |
| Payment pending sudhaarna | Admin → **Payments** — page kholte hi gateway se milaan ho jata hai |
| Contact messages | Admin → Messages |
| Password badalna | Admin → Settings |

Har status update par devotee ko WhatsApp message apne aap chala jaata hai (agar usne opt-in kiya ho).

---

## Useful commands

```bash
npm run dev          # local development
npm run build        # production build
npm start            # production server
npm run db:migrate   # naye database tables banayein/update karein
npm run db:seed      # demo content (pehli baar hi chalta hai)
npm run db:generate  # schema badalne par naya SQL migration banayein
npm run lint         # code check
npm run test:reconcile  # payment milaan ke sabhi cases test karein (nakli gateway se)
npm audit            # security check
```

---

## Project ka dhaancha

```
pooja-path/
├── drizzle/              # SQL migrations
├── scripts/              # migrate.ts, seed.ts
├── src/
│   ├── app/
│   │   ├── (site)/       # public website
│   │   ├── admin/        # admin panel (login + panel)
│   │   ├── api/          # bookings, payment, track, contact
│   │   └── layout.tsx
│   ├── components/       # Navbar, Hero, PujaCard, BookingForm, SacredArt…
│   ├── db/               # schema.ts (tables), index.ts (connection)
│   └── lib/              # auth, razorpay, whatsapp, validation, rate-limit, i18n
├── .env.example
├── render.yaml
└── next.config.ts        # security headers
```

---

## Content badalna

- **Pujas, packages, prices** → admin panel se
- **Site ka naam, phone, email** → `.env` / Render Environment
- **Menu, buttons, section headings ka text** → `src/lib/i18n.ts` (English + Hindi ek hi file me)
- **Rang aur design** → `tailwind.config.ts` (saffron / maroon / gold) aur `src/app/globals.css`
- **Card artwork** → `src/components/SacredArt.tsx` (naya chinh add kar sakte hain)
- **Temples, testimonials, FAQ** → abhi `scripts/seed.ts` me; database me seedha bhi badal sakte hain

---

## Copyright

Poora code, design aur content **original** hai. Bhaktimay se sirf website ka *structure* aur *idea* liya gaya hai — unka text, images, logo ya code kahin use nahi hua. Mandir aur puja ke naam saarvajanik tathya hain, unme koi copyright nahi.

Demo content (pujas, prices, testimonials) sirf example ke liye hai — live jaane se pehle apna asli content daal dena.
