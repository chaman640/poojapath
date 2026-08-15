import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, pujas } from "@/db/schema";
import { activeProvider, razorpay } from "@/lib/payments";
import { reconcileAllPending, type ReconcileVerdict } from "@/lib/payments/reconcile";
import { siteConfig } from "@/lib/env";
import { formatDate, formatINR } from "@/lib/utils";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import {
  cleanupAbandonedAction,
  forceMarkPaidAction,
  recheckPaymentAction,
} from "../../actions";

export const dynamic = "force-dynamic";

/**
 * Payments page — "payment ho gaya par booking pending dikh rahi hai"
 * ka jawab yahan ek nazar me mil jata hai.
 *
 * Page kholte hi har pending booking ke liye seedha gateway se poochha
 * jata hai ki us order par paisa aaya ya nahi. Jinka paisa mila hua nikla,
 * wo yahin confirm ho jati hain — kuch dabana nahi padta.
 */

const VERDICT_STYLE: Record<ReconcileVerdict, { cls: string; label: string }> = {
  "confirmed-now": { cls: "bg-green-100 text-green-800", label: "✓ Abhi confirm hui" },
  "already-done": { cls: "bg-green-100 text-green-800", label: "✓ Confirm hai" },
  "in-progress": { cls: "bg-blue-100 text-blue-800", label: "⏳ Bank ka jawab baaki" },
  "no-attempt": { cls: "bg-slate-200 text-slate-700", label: "◦ Payment hui hi nahi" },
  failed: { cls: "bg-red-100 text-red-800", label: "✕ Payment fail hui" },
  "amount-mismatch": { cls: "bg-amber-100 text-amber-900", label: "⚠️ Raashi alag hai" },
  "no-order": { cls: "bg-slate-200 text-slate-700", label: "◦ Order bana hi nahi" },
  "not-configured": { cls: "bg-amber-100 text-amber-900", label: "⚠️ Keys set nahi" },
  demo: { cls: "bg-slate-200 text-slate-700", label: "Demo booking" },
  error: { cls: "bg-red-100 text-red-800", label: "⚠️ Gateway se baat nahi hui" },
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ checked?: string; marked?: string; cleaned?: string }>;
}) {
  const sp = await searchParams;
  const provider = activeProvider();

  /* ---- Har pending booking ko gateway se milao ---- */
  const reports = await reconcileAllPending(20).catch(() => []);
  const byId = new Map(reports.map((r) => [r.bookingId, r]));

  /* ---- Milaan ke baad ki taaza list ---- */
  const [rows, [counts]] = await Promise.all([
    db
      .select({
        id: bookings.id,
        code: bookings.bookingCode,
        name: bookings.devoteeName,
        phone: bookings.phone,
        amount: bookings.amountInPaise,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        orderId: bookings.providerOrderId,
        paymentId: bookings.providerPaymentId,
        createdAt: bookings.createdAt,
        pujaTitle: pujas.titleEn,
      })
      .from(bookings)
      .innerJoin(pujas, eq(bookings.pujaId, pujas.id))
      .where(eq(bookings.status, "PENDING_PAYMENT"))
      .orderBy(desc(bookings.createdAt))
      .limit(50),
    db
      .select({
        pending: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} = 'PENDING_PAYMENT')`.mapWith(Number),
        confirmed: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} NOT IN ('PENDING_PAYMENT','CANCELLED'))`.mapWith(Number),
      })
      .from(bookings),
  ]);

  const justConfirmed = reports.filter((r) => r.verdict === "confirmed-now").length;
  const base = siteConfig.url.replace(/\/$/, "");

  /* ---- Setup health ---- */
  const keyMode = provider === "razorpay" ? razorpay.keyMode() : "unknown";
  const health: Array<[string, string, boolean, string?]> = [
    [
      "Payment gateway",
      provider === "none" ? "Juda nahi — Demo Mode" : provider,
      provider !== "none",
    ],
    ...(provider === "razorpay"
      ? ([
          [
            "Razorpay Key ID",
            `${razorpay.maskedKeyId()}  (${keyMode === "test" ? "TEST mode" : keyMode === "live" ? "LIVE mode" : "?"})`,
            keyMode === "live",
            keyMode === "test"
              ? "Test key par asli paisa nahi katta aur mobile par UPI app nahi khulta (“Can't open payment app”). Asli bookings ke liye rzp_live_ key daalein."
              : undefined,
          ],
          [
            "Webhook secret",
            razorpay.hasWebhookSecret()
              ? "Set hai"
              : "Set nahi hai — RAZORPAY_WEBHOOK_SECRET daalein",
            razorpay.hasWebhookSecret(),
            razorpay.hasWebhookSecret()
              ? undefined
              : `Webhook hi wo suraksha-jaal hai jo browser wapas na aane par bhi booking confirm karta hai. Razorpay Dashboard → Settings → Webhooks me URL ${base}/api/payment/webhook daalein (events: payment.captured, payment.failed, order.paid) aur wahi secret Render me bhi.`,
          ],
        ] as Array<[string, string, boolean, string?]>)
      : []),
    ["Callback URL", `${base}/api/payment/razorpay/callback`, true],
    ["Webhook URL", `${base}/api/payment/webhook`, true],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Payments</h1>
          <p className="mt-1 text-[14px] text-ink/55">
            Har pending booking ka gateway se milaan — page kholte hi apne aap ho jata hai
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/payments" className="btn-primary px-5 py-2.5">
            ↻ Dobara check karein
          </Link>
          <form action={cleanupAbandonedAction}>
            <ConfirmSubmit
              message={
                "Purani adhuri bookings list se hata dein?\n\nSirf wahi hatengi jinke baare me gateway saaf kahe ki payment hui hi nahi (aur jo 6 ghante se zyada purani hain). Jinka jawab nahi milega unhe haath nahi lagaya jayega."
              }
              className="btn-secondary px-5 py-2.5"
            >
              Purani adhuri bookings hataayein
            </ConfirmSubmit>
          </form>
        </div>
      </div>

      {/* ---------- Result messages ---------- */}
      {justConfirmed > 0 && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-800">
          ✓ {justConfirmed} booking ka paisa gateway par mila — abhi confirm kar di gayi.
        </p>
      )}
      {sp.marked === "1" && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-800">
          ✓ Booking haath se paid mark kar di gayi. Devotee ko WhatsApp confirmation chala gaya.
        </p>
      )}
      {sp.cleaned && sp.cleaned !== "0" && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-[13.5px] text-green-800">
          ✓ {sp.cleaned} adhuri booking list se hata di gayi.
        </p>
      )}
      {sp.cleaned === "0" && (
        <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13.5px] text-blue-800">
          Koi booking hatane laayak nahi mili — sab ya to nayi hain ya unka jawab gateway se
          nahi mila.
        </p>
      )}

      {/* ---------- Setup health ---------- */}
      <section className="card overflow-hidden">
        <h2 className="border-b border-saffron-100 px-5 py-3.5 text-base">Setup</h2>
        <dl className="divide-y divide-saffron-50">
          {health.map(([k, v, ok, warn]) => (
            <div key={k} className="px-5 py-3 text-[13.5px]">
              <div className="flex flex-wrap items-center gap-3">
                <dt className="w-40 shrink-0 text-ink/50">{k}</dt>
                <dd className="min-w-0 flex-1 break-all font-medium text-maroon-800">{v}</dd>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    ok ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {ok ? "OK" : "Dhyaan dein"}
                </span>
              </div>
              {warn && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] leading-relaxed text-amber-900">
                  {warn}
                </p>
              )}
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Counts ---------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">
            Abhi pending
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-amber-700">{counts.pending}</p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">
            Confirm ho chuki
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-green-700">
            {counts.confirmed}
          </p>
        </div>
      </div>

      {/* ---------- Pending list ---------- */}
      <section className="card overflow-hidden">
        <h2 className="border-b border-saffron-100 px-5 py-3.5 text-base">
          Pending bookings — gateway kya kehta hai
        </h2>

        {rows.length === 0 ? (
          <p className="p-10 text-center text-[14px] text-ink/50">
            🎉 Ek bhi booking pending nahi hai.
          </p>
        ) : (
          <ul className="divide-y divide-saffron-50">
            {rows.map((b) => {
              const r = byId.get(b.id);
              const style = r ? VERDICT_STYLE[r.verdict] : null;

              return (
                <li key={b.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="font-mono text-[13px] font-bold text-saffron-700 hover:underline"
                      >
                        {b.code}
                      </Link>
                      <p className="mt-0.5 text-[13.5px] font-semibold text-maroon-800">
                        {b.name} • {b.phone}
                      </p>
                      <p className="text-[12.5px] text-ink/55">
                        {b.pujaTitle} • {formatINR(b.amount)} •{" "}
                        {formatDate(b.createdAt, "en")}
                      </p>
                    </div>

                    {style && (
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11.5px] font-bold ${style.cls}`}
                      >
                        {style.label}
                      </span>
                    )}
                  </div>

                  {r && (
                    <p className="mt-2 rounded-lg bg-saffron-50/70 px-3 py-2 text-[12.5px] leading-relaxed text-ink/70">
                      {r.message}
                    </p>
                  )}

                  {r && r.attempts.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {r.attempts.map((a) => (
                        <li
                          key={a.id}
                          className="flex flex-wrap items-center gap-2 text-[11.5px] text-ink/55"
                        >
                          <code className="rounded bg-white px-1.5 py-0.5 font-mono">
                            {a.id}
                          </code>
                          <span className="font-semibold text-maroon-800">{a.status}</span>
                          <span>{formatINR(a.amount)}</span>
                          {a.method && <span>via {a.method}</span>}
                          {a.errorDescription && (
                            <span className="text-red-700">— {a.errorDescription}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="text-[11.5px] text-ink/45">
                      Order: <code className="font-mono">{b.orderId ?? "—"}</code>
                      {b.paymentId && (
                        <>
                          {" "}• Txn: <code className="font-mono">{b.paymentId}</code>
                        </>
                      )}
                    </p>

                    <div className="ml-auto flex flex-wrap gap-2">
                      <form action={recheckPaymentAction}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-saffron-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-saffron-700"
                        >
                          ↻ Ab check karein
                        </button>
                      </form>

                      <form action={forceMarkPaidAction}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <ConfirmSubmit
                          message={`SAAVDHAN!\n\n"${b.code}" ko haath se PAID mark karein?\n\nYe tabhi karein jab aapko pakka pata ho ki paisa aa gaya hai (bank statement ya Razorpay dashboard me dikh raha ho). Devotee ko turant confirmation WhatsApp chala jayega.`}
                          className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-green-700"
                        >
                          Haath se paid mark karein
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {counts.pending > 20 && (
          <p className="border-t border-saffron-50 px-5 py-3 text-[12px] text-ink/50">
            Note: ek baar me sirf 20 sabse nayi pending bookings gateway se check hoti hain
            (taaki page dheema na ho). Baaki ke liye page dobara kholein ya unke saamne
            “Ab check karein” dabayein.
          </p>
        )}
      </section>

      {/* ---------- Samajhne ke liye ---------- */}
      <section className="card p-5">
        <h2 className="text-base">Ye page kya batata hai</h2>
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink/70">
          <li>
            <strong>◦ Payment hui hi nahi</strong> — user ne payment window band kar di.
            Paisa nahi kata, booking se koi lena-dena nahi. Ye sabse aam wajah hai.
          </li>
          <li>
            <strong>⏳ Bank ka jawab baaki</strong> — UPI/netbanking me kabhi-kabhi 2-10 minute
            lagte hain. Thodi der baad apne aap confirm ho jayegi.
          </li>
          <li>
            <strong>✕ Payment fail hui</strong> — bank ne mana kar diya. Paisa nahi kata.
          </li>
          <li>
            <strong>✓ Abhi confirm hui</strong> — paisa pehle hi aa chuka tha par browser
            wapas nahi aaya tha; humne gateway se poochh kar booking confirm kar di.
          </li>
          <li>
            <strong>⚠️ Gateway se baat nahi hui</strong> — keys galat hain ya Razorpay down
            hai. Setup wale hisse me upar dekhein.
          </li>
        </ul>
      </section>
    </div>
  );
}
