"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeAccount } from "@/lib/customer/actions";

/** Removes the website sign-in and saved addresses; shop records and past orders stay with MYNIX. */
export default function CloseAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm text-red-300/80 underline-offset-4 hover:text-red-300 hover:underline">
        Close my online account
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
      <p className="text-sm leading-relaxed text-white/75">
        This removes your website sign-in and saved addresses. Your purchase history stays with MYNIX, and you can create
        a new account with the same number any time.
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await closeAccount();
              if (!result.ok) return setError(result.error);
              router.replace("/");
              router.refresh();
            })
          }
          className="rounded-full bg-red-500/90 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Closing…" : "Close account"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-sm text-white/55 hover:text-white">
          Keep my account
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
