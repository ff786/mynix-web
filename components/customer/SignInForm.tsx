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
export default function SignInForm({ next, initialPhone }: { next: string; initialPhone?: string }) {
  const router = useRouter();
  const [verified, setVerified] = useState<VerifiedResult | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const finish = (details: { name?: string; email?: string } = {}) =>
    startTransition(async () => {
      setError(null);
      const result = await completeSignIn(details);
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
        <PhoneVerifier
          purpose="ACCOUNT"
          inputClassName={inputClass}
          initialPhone={initialPhone}
          onVerified={onVerified}
          onReset={() => setVerified(null)}
        />
      </div>

      {verified && !verified.accountExists && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            finish({ name: verified.existingCustomerName ? undefined : name, email });
          }}
          className="space-y-4 rounded-2xl border border-white/10 p-5"
        >
          {verified.existingCustomerName ? (
            <p className="text-sm text-white/80">
              Welcome back, <span className="font-medium text-white">{verified.existingCustomerName}</span> — we
              found you in our shop records. Add your email to finish creating your online account.
            </p>
          ) : (
            <div className="space-y-2">
              <label htmlFor="account-name" className="block text-sm text-white/70">
                Your name
              </label>
              <input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={150}
                autoComplete="name"
                required
                className={inputClass}
              />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="account-email" className="block text-sm text-white/70">
              Email
            </label>
            <input
              id="account-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              autoComplete="email"
              required
              className={inputClass}
            />
            <p className="text-xs text-white/40">For order updates. Your mobile number stays your sign-in.</p>
          </div>
          <button
            type="submit"
            disabled={pending || !email.trim() || (!verified.existingCustomerName && !name.trim())}
            className="w-full rounded-full bg-white py-3 text-sm font-medium text-[#1d1d1f] disabled:opacity-60"
          >
            {pending ? "Creating…" : verified.existingCustomerName ? "Create my account" : "Create account"}
          </button>
        </form>
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
