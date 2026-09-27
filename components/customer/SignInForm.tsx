"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PhoneVerifier, { type VerifiedResult } from "@/components/customer/PhoneVerifier";
import { completeSignIn } from "@/lib/customer/actions";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-white/30 transition-colors focus:border-white/40 focus:outline-none";

/**
 * Sign in or create an account with a mobile number. A number the shop
 * already knows is linked to that customer record (no duplicate details).
 */
export default function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [verified, setVerified] = useState<VerifiedResult | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const finish = (withName?: string) =>
    startTransition(async () => {
      setError(null);
      const result = await completeSignIn({ name: withName });
      if (!result.ok) return setError(result.error);
      router.replace(next);
      router.refresh();
    });

  const onVerified = (result: VerifiedResult) => {
    setVerified(result);
    // Existing account: straight in.
    if (result.accountExists) finish();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="account-phone" className="block text-sm text-white/70">
          Mobile number
        </label>
        <PhoneVerifier purpose="ACCOUNT" inputClassName={inputClass} onVerified={onVerified} onReset={() => setVerified(null)} />
      </div>

      {verified && !verified.accountExists && (
        <div className="space-y-4 rounded-2xl border border-white/10 p-5">
          {verified.existingCustomerName ? (
            <>
              <p className="text-sm text-white/80">
                Welcome back, <span className="font-medium text-white">{verified.existingCustomerName}</span> — we
                found you in our shop records. Create your online account to see your orders here.
              </p>
              <button
                type="button"
                onClick={() => finish()}
                disabled={pending}
                className="w-full rounded-full bg-white py-3 text-sm font-medium text-[#1d1d1f] disabled:opacity-60"
              >
                {pending ? "Creating…" : "Create my account"}
              </button>
            </>
          ) : (
            <>
              <label htmlFor="account-name" className="block text-sm text-white/70">
                Your name
              </label>
              <input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={150}
                autoComplete="name"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => finish(name)}
                disabled={pending || !name.trim()}
                className="w-full rounded-full bg-white py-3 text-sm font-medium text-[#1d1d1f] disabled:opacity-60"
              >
                {pending ? "Creating…" : "Create account"}
              </button>
            </>
          )}
        </div>
      )}

      {verified?.accountExists && pending && <p className="text-sm text-white/60">Signing you in…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
