"use client";

import { useActionState } from "react";
import { verifyTwoStep, type CodeState } from "@/app/admin/account-actions";
import { Field } from "@/components/admin/fields";
import CodeInput from "@/components/admin/CodeInput";
import { buttonClasses } from "@/components/ui/Button";

export default function TwoStepVerifyForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<CodeState, FormData>(verifyTwoStep, {});

  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Authenticator code" htmlFor="code">
        <CodeInput />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClasses({ size: "lg", className: "w-full" })}>
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
