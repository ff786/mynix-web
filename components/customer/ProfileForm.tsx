"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/customer/actions";
import { formatMobile } from "@/lib/phone";
import { accountInput, primaryButton } from "@/components/customer/ui";

type ProfileFormProps = { name: string; email: string | null; phone: string };

export default function ProfileForm({ name, email, phone }: ProfileFormProps) {
  const [values, setValues] = useState({ name, email: email ?? "" });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = values.name !== name || values.email !== (email ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateProfile(values);
          setMessage(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error });
        });
      }}
      className="max-w-lg space-y-5"
    >
      <div className="space-y-2">
        <label htmlFor="profile-name" className="block text-sm text-white/70">
          Name
        </label>
        <input
          id="profile-name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          required
          maxLength={150}
          autoComplete="name"
          className={accountInput}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="profile-email" className="block text-sm text-white/70">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          required
          maxLength={254}
          autoComplete="email"
          className={accountInput}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-white/70">Mobile number</p>
        <p className="rounded-xl border border-white/10 px-4 py-3 text-[15px] text-white/60">{formatMobile(phone)}</p>
        <p className="text-xs text-white/40">
          Your mobile number is your sign-in and links you to our shop records. To change it, contact us on WhatsApp.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending || !changed} className={primaryButton}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-emerald-300" : "text-sm text-red-300"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
