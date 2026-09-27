"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { checkVerificationCode, sendVerificationCode } from "@/lib/customer/actions";
import type { VerifyPurpose } from "@/lib/customer/session";
import { cn } from "@/utils/cn";

export type VerifiedResult = { phone: string; accountExists: boolean; existingCustomerName: string | null };

type PhoneVerifierProps = {
  purpose: VerifyPurpose;
  onVerified: (result: VerifiedResult) => void;
  /** Reset the verified state (e.g. "use a different number"). */
  onReset?: () => void;
  inputClassName: string;
};

/** Mobile number → SMS code → verified. The proof is kept server-side in an HttpOnly cookie. */
export default function PhoneVerifier({ purpose, onVerified, onReset, inputClassName }: PhoneVerifierProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code" | "verified">("phone");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const send = () =>
    startTransition(async () => {
      setError(null);
      const result = await sendVerificationCode({ phone, purpose });
      if (!result.ok) return setError(result.error);
      setStep("code");
      setCode("");
      setCooldown(60);
    });

  const check = () =>
    startTransition(async () => {
      setError(null);
      const result = await checkVerificationCode({ phone, code, purpose });
      if (!result.ok) return setError(result.error);
      setStep("verified");
      onVerified({ phone, accountExists: result.accountExists, existingCustomerName: result.existingCustomerName });
    });

  if (step === "verified") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3">
        <span className="flex items-center gap-2 text-sm text-white/85">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          {phone} verified
        </span>
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            onReset?.();
          }}
          className="text-xs text-white/50 underline-offset-4 hover:text-white hover:underline"
        >
          Use a different number
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          id={`${purpose.toLowerCase()}-phone`}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())}
          inputMode="tel"
          autoComplete="tel"
          placeholder="077 123 4567"
          maxLength={20}
          disabled={step === "code"}
          aria-label="Mobile number"
          className={cn(inputClassName, "flex-1 disabled:opacity-60")}
        />
        {step === "phone" ? (
          <button
            type="button"
            onClick={send}
            disabled={pending || phone.trim().length < 9}
            className="shrink-0 rounded-xl bg-white px-4 text-sm font-medium text-[#1d1d1f] disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send code"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="shrink-0 rounded-xl border border-white/15 px-4 text-sm text-white/70 hover:text-white"
          >
            Change
          </button>
        )}
      </div>

      {step === "code" && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">We sent a 6-digit code by SMS to {phone}.</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), check())}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              aria-label="Verification code"
              className={cn(inputClassName, "flex-1 tracking-[0.3em]")}
            />
            <button
              type="button"
              onClick={check}
              disabled={pending || code.length !== 6}
              className="shrink-0 rounded-xl bg-white px-4 text-sm font-medium text-[#1d1d1f] disabled:opacity-50"
            >
              {pending ? "Checking…" : "Verify"}
            </button>
          </div>
          <button
            type="button"
            onClick={send}
            disabled={pending || cooldown > 0}
            className="text-xs text-white/50 underline-offset-4 hover:text-white hover:underline disabled:no-underline disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
