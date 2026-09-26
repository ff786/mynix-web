"use client";

import { useActionState } from "react";
import { twoStepSetup, type SetupState } from "@/app/admin/account-actions";
import { Field } from "@/components/admin/fields";
import CodeInput from "@/components/admin/CodeInput";
import { buttonClasses } from "@/components/ui/Button";

export default function TwoStepSetupForm() {
  const [state, action, pending] = useActionState<SetupState, FormData>(twoStepSetup, {});

  if (!state.factorId) {
    return (
      <form action={action} className="space-y-5">
        <input type="hidden" name="intent" value="start" />
        <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink/70">
          <li>
            Install an authenticator app on your phone, such as Google Authenticator, Microsoft Authenticator or
            1Password.
          </li>
          <li>Scan the QR code on the next screen.</li>
          <li>Enter the 6-digit code the app shows.</li>
        </ol>

        {state.error && (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={buttonClasses({ size: "lg", className: "w-full" })}>
          {pending ? "Preparing…" : "Show QR code"}
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-3 text-center">
        {/* Supabase returns the QR code as an SVG data URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={state.qrCode} alt="QR code for your authenticator app" className="mx-auto h-48 w-48" />
        <details className="text-left text-sm text-ink/60">
          <summary className="cursor-pointer text-center">Can&apos;t scan? Enter the key instead</summary>
          <code className="mt-3 block break-all rounded-xl bg-ink/5 px-3 py-2.5 text-center text-[13px] tracking-wider text-ink">
            {state.secret}
          </code>
        </details>
      </div>

      <Field label="Code from the app" htmlFor="code">
        <CodeInput />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClasses({ size: "lg", className: "w-full" })}>
        {pending ? "Checking…" : "Turn on two-step sign-in"}
      </button>
    </form>
  );
}
