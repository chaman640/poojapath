import { getDict, pick, type Lang } from "@/lib/i18n";
import { cn, formatDate } from "@/lib/utils";
import type { BookingEvent, BookingStatus } from "@/db/schema";

const FLOW: BookingStatus[] = [
  "CONFIRMED",
  "PERFORMED",
  "VIDEO_SENT",
  "PRASAD_DISPATCHED",
  "COMPLETED",
];

export default function BookingTimeline({
  lang,
  status,
  events,
}: {
  lang: Lang;
  status: BookingStatus;
  events: BookingEvent[];
}) {
  const t = getDict(lang);

  if (status === "CANCELLED" || status === "REFUNDED" || status === "PENDING_PAYMENT") {
    return (
      <div className="rounded-2xl border border-saffron-200 bg-saffron-50 p-5 text-center">
        <p className="font-semibold text-maroon-800">{t.status[status]}</p>
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(status);

  return (
    <div className="space-y-6">
      <ol className="relative space-y-0">
        {FLOW.map((step, i) => {
          const done = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const last = i === FLOW.length - 1;

          return (
            <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
              {!last && (
                <span
                  className={cn(
                    "absolute left-[15px] top-8 h-full w-0.5",
                    done ? "bg-saffron-400" : "bg-saffron-100",
                  )}
                  aria-hidden="true"
                />
              )}

              <span
                className={cn(
                  "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-[13px] font-bold transition",
                  done
                    ? "border-saffron-600 bg-saffron-600 text-white"
                    : "border-saffron-200 bg-white text-saffron-300",
                  isCurrent && "ring-4 ring-saffron-200",
                )}
              >
                {done ? "✓" : i + 1}
              </span>

              <div className="pt-1">
                <p
                  className={cn(
                    "text-[15px] font-semibold",
                    done ? "text-maroon-800" : "text-ink/40",
                  )}
                >
                  {t.status[step]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {events.length > 0 && (
        <div className="rounded-2xl border border-saffron-100 bg-white p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-saffron-700">
            {lang === "hi" ? "अपडेट" : "Updates"}
          </h3>
          <ul className="mt-4 space-y-4">
            {events.map((e) => (
              <li key={e.id} className="border-l-2 border-saffron-200 pl-4">
                <p className="text-[13px] font-bold text-maroon-800">
                  {t.status[e.status]}
                </p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink/70">
                  {pick(lang, e.messageEn, e.messageHi)}
                </p>
                <p className="mt-1 text-[11px] text-ink/40">
                  {formatDate(e.createdAt, lang)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
