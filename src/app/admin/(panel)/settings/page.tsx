import { getAdminSession } from "@/lib/auth";
import {siteConfig, whatsappProvider} from "@/lib/env";
import PasswordForm from "./PasswordForm";
import { activeProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  const wa = whatsappProvider();
  const payProvider = activeProvider();

  const rows: Array<[string, string, boolean]> = [
    ["Site URL", siteConfig.url, siteConfig.url.startsWith("https://")],
    ["Support phone", siteConfig.phone, siteConfig.phone !== "+919000000000"],
    ["Support WhatsApp", siteConfig.whatsapp, siteConfig.whatsapp !== "+919000000000"],
    ["Support email", siteConfig.email, true],
    [
      "Payment gateway",
      payProvider === "none"
        ? "Not connected — Demo Mode"
        : `Connected (${payProvider}) — live payments chalu`,
      payProvider !== "none",
    ],
    [
      "Business address",
      siteConfig.address || "Set nahi hai — gateway KYC ke liye zaroori",
      Boolean(siteConfig.address),
    ],
    [
      "WhatsApp provider",
      wa === "none" ? "Not connected — messages sirf log me" : `Connected (${wa})`,
      wa !== "none",
    ],
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">Settings</h1>
        <p className="mt-1 text-[14px] text-ink/55">
          Logged in as <span className="font-semibold text-maroon-800">{session?.email}</span>
        </p>
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b border-saffron-100 px-5 py-3.5 text-base">
          Environment status
        </h2>
        <dl className="divide-y divide-saffron-50">
          {rows.map(([k, v, ok]) => (
            <div key={k} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13.5px]">
              <dt className="w-44 shrink-0 text-ink/50">{k}</dt>
              <dd className="min-w-0 flex-1 break-words font-medium text-maroon-800">{v}</dd>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  ok ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {ok ? "OK" : "Set karein"}
              </span>
            </div>
          ))}
        </dl>
        <p className="border-t border-saffron-50 px-5 py-4 text-[12.5px] leading-relaxed text-ink/55">
          Ye values Render dashboard ke <strong>Environment</strong> tab se aati hain.
          Badalne ke baad service ko redeploy karna zaroori hai.
        </p>
      </section>

      <section className="max-w-md">
        <h2 className="mb-3 text-lg">Password badlein</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
