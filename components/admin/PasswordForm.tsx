"use client";

import { useActionState } from "react";
import { changePassword, resetPassword, type PasswordState } from "@/app/admin/account-actions";
import { Field, inputClasses } from "@/components/admin/fields";
import { buttonClasses } from "@/components/ui/Button";

/** `reset` after an emailed link (redirects when done), `change` on the Security page. */
export default function PasswordForm({ mode }: { mode: "reset" | "change" }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    mode === "reset" ? resetPassword : changePassword,
    {},
  );

  return (
    <form action={action} className="space-y-5">
      <Field label="New password" htmlFor="password" hint="At least 12 characters.">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required className={inputClasses} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={12} required className={inputClasses} />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.done && (
        <p role="status" className="text-sm text-ink/70">
          Password changed.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ size: "lg", className: mode === "reset" ? "w-full" : undefined })}
      >
        {pending ? "Saving…" : mode === "reset" ? "Set new password" : "Change password"}
      </button>
    </form>
  );
}
