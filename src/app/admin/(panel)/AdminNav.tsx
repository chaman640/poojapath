"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/pujas", label: "Pujas" },
  { href: "/admin/addons", label: "Add-ons" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-saffron-50 bg-white">
      <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  "-mb-px block whitespace-nowrap border-b-2 px-3 py-2.5 text-[13.5px] font-semibold transition",
                  active
                    ? "border-saffron-600 text-saffron-700"
                    : "border-transparent text-ink/55 hover:text-maroon-800",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
