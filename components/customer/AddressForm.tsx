"use client";

import { useState, useTransition } from "react";
import { saveAddress, type AddressInput } from "@/lib/customer/actions";
import type { SavedAddress } from "@/lib/customer/profile";
import { DISTRICTS } from "@/lib/districts";
import { accountInput, primaryButton, quietButton } from "@/components/customer/ui";
import { cn } from "@/utils/cn";

type AddressFormProps = {
  address?: SavedAddress;
  onDone: () => void;
};

/** Add or edit a saved address. */
export default function AddressForm({ address, onDone }: AddressFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const input: AddressInput = {
          label: String(f.get("label") ?? ""),
          addressLine1: String(f.get("addressLine1") ?? ""),
          addressLine2: String(f.get("addressLine2") ?? ""),
          city: String(f.get("city") ?? ""),
          district: String(f.get("district") ?? "") as AddressInput["district"],
          postalCode: String(f.get("postalCode") ?? ""),
          makeDefault: f.get("makeDefault") === "on",
        };
        startTransition(async () => {
          const result = await saveAddress(input, address?.id);
          if (!result.ok) return setError(result.error);
          onDone();
        });
      }}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
    >
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <input name="label" required maxLength={40} defaultValue={address?.label ?? "Home"} aria-label="Name for this address" placeholder="Home" className={accountInput} />
        <input name="addressLine1" required maxLength={200} defaultValue={address?.addressLine1} aria-label="Address" placeholder="Address" autoComplete="address-line1" className={accountInput} />
      </div>
      <input name="addressLine2" maxLength={200} defaultValue={address?.addressLine2 ?? ""} aria-label="Apartment, landmark (optional)" placeholder="Apartment, landmark (optional)" autoComplete="address-line2" className={accountInput} />
      <div className="grid gap-4 sm:grid-cols-3">
        <input name="city" required maxLength={100} defaultValue={address?.city} aria-label="City" placeholder="City" autoComplete="address-level2" className={accountInput} />
        <select name="district" required defaultValue={address?.district ?? ""} aria-label="District" className={cn(accountInput, "appearance-none")}>
          <option value="" disabled>
            District…
          </option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input name="postalCode" maxLength={20} inputMode="numeric" pattern="[0-9]{5}" title="Sri Lankan postal codes have 5 digits, e.g. 10350." defaultValue={address?.postalCode ?? ""} aria-label="Postal code (optional)" placeholder="Postal code" autoComplete="postal-code" className={accountInput} />
      </div>
      {!address?.defaultAddress && (
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="makeDefault" className="accent-white" /> Use as my default address
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : address ? "Save address" : "Add address"}
        </button>
        <button type="button" onClick={onDone} className={quietButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}
