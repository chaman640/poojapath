import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Contact messages</h1>
        <p className="mt-1 text-[14px] text-ink/55">{rows.length} messages</p>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-[14px] text-ink/50">
          Abhi koi message nahi aaya.
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((m) => (
            <li key={m.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-maroon-800">{m.subject}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink/55">
                    {m.name} • {m.phone}
                    {m.email ? ` • ${m.email}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] text-ink/45">
                    {formatDate(m.createdAt, "en")}
                  </span>
                  <a
                    href={`https://wa.me/${m.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[#25D366] px-3 py-1 text-[11.5px] font-bold text-white"
                  >
                    Reply
                  </a>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line border-l-2 border-saffron-200 pl-4 text-[13.5px] leading-relaxed text-ink/70">
                {m.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
