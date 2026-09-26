"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ForgotState } from "@/app/admin/account-actions";
import { Field, inputClasses } from "@/components/admin/fields";
import { buttonClasses } from "@/components/ui/Button";

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestPasswordReset, {});

  if (state.sent) {
    return (
      <p role="status" className="text-[15px] leading-relaxed text-ink/70">
        If <strong className="font-medium text-ink">{state.email}</strong> belongs to an admin, a reset link is on its
        way. It works once and expires after an hour. Check your spam folder if it doesn&apos;t arrive.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={inputClasses}
        />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClasses({ size: "lg", className: "w-full" })}>
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
    </form>
  );
}
