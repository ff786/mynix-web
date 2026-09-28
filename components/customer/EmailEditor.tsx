"use client";

import { useState, useTransition } from "react";
import { updateEmail } from "@/lib/customer/actions";

/** Shows the account email with an inline "Change" form. */
export default function EmailEditor({ initialEmail }: { initialEmail: string | null }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [saved, setSaved] = useState(initialEmail);
  const [editing, setEditing] = useState(!initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <p className="text-white/70">
        {saved}{" "}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-2 text-sm text-white/45 underline-offset-4 hover:text-white hover:underline"
        >
          Change
        </button>
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          setError(null);
          const result = await updateEmail({ email });
          if (!result.ok) return setError(result.error);
          setSaved(result.email);
          setEditing(false);
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        maxLength={254}
        autoComplete="email"
        placeholder="you@example.com"
        aria-label="Email"
        className="min-w-60 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#1d1d1f] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save email"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
