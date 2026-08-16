"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateBookingAction, type ActionState } from "../../../actions";
import type { BookingStatus } from "@/db/schema";

const OPTIONS: Array<{ value: BookingStatus; label: string }> = [
  { value: "PENDING_PAYMENT", label: "Payment pending" },
  { value: "CONFIRMED", label: "Booking confirmed" },
  { value: "PERFORMED", label: "Puja performed" },
  { value: "VIDEO_SENT", label: "Video shared" },
  { value: "PRASAD_DISPATCHED", label: "Prasad dispatched" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-5 w-full py-2.5">
      {pending ? "Saving…" : "Update & notify"}
    </button>
  );
}

export default function BookingUpdateForm({
  bookingId,
  currentStatus,
  videoUrl,
  prasadTracking,
  adminNote,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
  videoUrl: string;
  prasadTracking: string;
  adminNote: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateBookingAction,
    {},
  );

  return (
    <form action={formAction} className="card p-5 lg:sticky lg:top-32">
      <input type="hidden" name="bookingId" value={bookingId} />

      <h2 className="text-base">Booking update karein</h2>
      <p className="mt-1 text-[12.5px] text-ink/55">
        Status badalne par devotee ko WhatsApp par apne aap message chala jayega.
      </p>

      <div className="mt-4">
        <label className="label" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className="input py-2.5"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="videoUrl">
          Puja video link
        </label>
        <input
          id="videoUrl"
          name="videoUrl"
          type="url"
          defaultValue={videoUrl}
          maxLength={500}
          placeholder="https://drive.google.com/…"
          className="input py-2.5"
        />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="prasadTracking">
          Prasad tracking number
        </label>
        <input
          id="prasadTracking"
          name="prasadTracking"
          defaultValue={prasadTracking}
          maxLength={120}
          placeholder="e.g. Delhivery 1234567890"
          className="input py-2.5"
        />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="adminNote">
          Note (devotee ko dikhega)
        </label>
        <textarea
          id="adminNote"
          name="adminNote"
          rows={3}
          defaultValue={adminNote}
          maxLength={1000}
          className="input resize-y py-2.5"
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13px] text-ink/70">
        <input
          type="checkbox"
          name="notify"
          defaultChecked
          className="h-4 w-4 rounded border-saffron-300 accent-saffron-600"
        />
        WhatsApp par update bhejein
      </label>

      {state.error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-[13px] text-red-800">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-4 rounded-xl border border-green-300 bg-green-50 px-4 py-2.5 text-[13px] text-green-800">
          ✓ {state.success}
        </p>
      )}

      <Submit />
    </form>
  );
}
