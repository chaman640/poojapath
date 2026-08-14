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
  "Ghar bhejne wale" add-on chunte hi pata bharna zaroori ho jata hai
- **Paytm** payment (UPI, card, netbanking) — Razorpay par switch karna ho to bhi tayyar
- Services & Pricing page (`/pricing`) — payment gateway KYC ke liye
- Booking status page + "Track Booking" (Booking ID + number se)
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
| Payment | **Paytm** (Razorpay bhi supported) | `.env` me ek line badal kar switch kar sakte hain |
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
| Payment tampering | Amount hamesha database se, kabhi browser se nahi; Paytm checksum verify + Transaction Status API se server-to-server confirm |
| Fake callback/webhook | Paytm CHECKSUMHASH aur Razorpay HMAC verify — bina sahi signature ke reject |
| Spam bookings/messages | IP rate limiting + contact form me honeypot |
| Booking ID guessing | Track page par 10 min me 8 koshish, phir 20 min block |
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

## Paytm payment gateway chalu karna

Site **Paytm** ke liye tayyar hai. Jab tak keys nahi hain, "Demo Mode" me chalti hai —
booking ban jati hai par paisa nahi katta.

### 1. Paytm merchant account

[business.paytm.com](https://business.paytm.com) par account banayein aur KYC poori karein
(PAN, bank account, business proof). Approval ke baad Dashboard →
**Developer Settings → API Keys** me ye do milenge:

- **MID** (Merchant ID)
- **Merchant Key** (16 characters)

### 2. Callback URL set karein

Paytm dashboard me website/callback URL ye rakhein:

```
https://aapka-domain.com/api/payment/paytm/callback
```

### 3. Render → Environment me bharein

```
PAYMENT_PROVIDER   = paytm
PAYTM_MID          = aapka MID
PAYTM_MERCHANT_KEY = aapki merchant key
PAYTM_WEBSITE      = DEFAULT          # test ke liye: WEBSTAGING
PAYTM_ENV          = production       # pehle test karna ho to: test
```

**Redeploy** karein — payment live ho jayega.

> **Pehle test karein:** `PAYTM_ENV=test` aur `PAYTM_WEBSITE=WEBSTAGING` rakh kar Paytm ki
> staging keys se ek booking karke dekh lein. Sab theek lage to production par switch karein.

### Security — Paytm ke saath kya-kya hota hai

- Amount hamesha database se jata hai, browser se kabhi nahi
- Har request par Paytm ka **checksum** (AES + SHA-256) banta aur verify hota hai
- Payment ke baad browser jo bhi kahe, uspar bharosa nahi — hum **Paytm ke server se
  seedha Transaction Status API** se pooch kar hi booking confirm karte hain
- Merchant Key sirf server par rehti hai, browser tak kabhi nahi jaati

### Razorpay par switch karna ho to

`.env` me itna hi:

```
PAYMENT_PROVIDER    = razorpay
RAZORPAY_KEY_ID     = ...
RAZORPAY_KEY_SECRET = ...
```

Razorpay ka code pehle se maujood hai — kuch aur badalne ki zaroorat nahi.

---

## Payment gateway KYC ke liye zaroori pages

Paytm/Razorpay approval ke waqt ye pages maangte hain — **sab pehle se bane hue hain**:

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
