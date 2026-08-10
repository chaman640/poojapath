"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type ActionState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-5 w-full py-3">
      {pending ? "Checking…" : "Login"}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="rounded-2xl bg-white p-6 shadow-lift">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          maxLength={200}
          className="input"
        />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
          maxLength={200}
          className="input"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-800"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
