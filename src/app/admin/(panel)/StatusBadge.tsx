import type { BookingStatus } from "@/db/schema";

const STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-green-100 text-green-800",
  PERFORMED: "bg-emerald-100 text-emerald-800",
  VIDEO_SENT: "bg-indigo-100 text-indigo-800",
  PRASAD_DISPATCHED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-orange-100 text-orange-800",
};

const LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Payment pending",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  PERFORMED: "Performed",
  VIDEO_SENT: "Video sent",
  PRASAD_DISPATCHED: "Prasad sent",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
