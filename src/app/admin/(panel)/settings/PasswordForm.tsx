"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction, type ActionState } from "../../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-5 w-full py-2.5">
      {pending ? "Saving…" : "Password badlein"}
    </button>
  );
}

export default function PasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    changePasswordAction,
    {},
  );

  return (
    <form action={formAction} className="card p-5">
      <div>
        <label className="label" htmlFor="currentPassword">
          Purana password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="newPassword">
          Naya password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="input"
        />
        <p className="mt-1.5 text-[11.5px] text-ink/45">
          Kam se kam 10 character. Letters, number aur symbol milakar rakhein.
        </p>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="confirmPassword">
          Naya password dobara
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="input"
        />
      </div>

      {state.error && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-[13px] text-red-800">
          {state.error}
        </p>
      )}

      <p className="mt-4 text-[12px] text-ink/50">
        Password badalte hi aap sabhi devices se logout ho jayenge.
      </p>

      <Submit />
    </form>
  );
}
