import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const sp = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-temple-gradient px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-500/20 text-2xl text-gold-200 ring-1 ring-gold-300/30">
            ॐ
          </span>
          <h1 className="mt-4 font-display text-2xl text-gold-100">Pooja Path Admin</h1>
          <p className="mt-1 text-[13px] text-saffron-100/70">
            Sirf authorised staff ke liye
          </p>
        </div>

        {sp.changed === "1" && (
          <p className="mb-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-[13px] text-green-800">
            Password badal gaya. Naye password se login karein.
          </p>
        )}

        <LoginForm />

        <p className="mt-6 text-center text-[11px] text-saffron-100/50">
          Is page par 6 galat koshishon ke baad account 30 minute ke liye lock ho jata hai.
        </p>
      </div>
    </div>
  );
}
