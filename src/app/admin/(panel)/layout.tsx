import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "../actions";
import AdminNav from "./AdminNav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check har admin page par server side hota hai —
  // middleware par bharosa nahi kiya gaya (wo bypass ho sakta hai).
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-40 border-b border-saffron-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-saffron-600 to-maroon-700 text-gold-200">
              ॐ
            </span>
            <span className="font-display text-base font-bold text-maroon-800">
              Pooja Path <span className="text-saffron-600">Admin</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden text-[13px] font-semibold text-ink/60 hover:text-saffron-700 sm:inline"
            >
              Site dekhein ↗
            </Link>
            <span className="hidden text-[13px] text-ink/55 md:inline">{session.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="btn-secondary px-4 py-1.5 text-[13px]">
                Logout
              </button>
            </form>
          </div>
        </div>

        <AdminNav />
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-saffron-100 py-5 text-center text-[12px] text-ink/45">
        Pooja Path Admin • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
