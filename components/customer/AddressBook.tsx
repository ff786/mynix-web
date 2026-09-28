"use client";

import { useState, useTransition } from "react";
import { MapPin, Plus } from "lucide-react";
import AddressForm from "@/components/customer/AddressForm";
import { quietButton } from "@/components/customer/ui";
import { deleteAddress, makeDefaultAddress } from "@/lib/customer/actions";
import type { SavedAddress } from "@/lib/customer/profile";

const MAX = 10;

export default function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const [editing, setEditing] = useState<number | "new" | null>(addresses.length === 0 ? "new" : null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
    });

  return (
    <div className="space-y-4">
      {addresses.map((address) =>
        editing === address.id ? (
          <AddressForm key={address.id} address={address} onDone={() => setEditing(null)} />
        ) : (
          <div key={address.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium text-white/90">
                {address.label}
                {address.defaultAddress && (
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-white/60">
                    Default
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/60">
                {[address.addressLine1, address.addressLine2, `${address.city}, ${address.district}`, address.postalCode]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                <button type="button" onClick={() => setEditing(address.id)} disabled={pending} className={quietButton}>
                  Edit
                </button>
                {!address.defaultAddress && (
                  <button type="button" onClick={() => run(() => makeDefaultAddress(address.id))} disabled={pending} className={quietButton}>
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.confirm(`Remove "${address.label}"?`) && run(() => deleteAddress(address.id))}
                  disabled={pending}
                  className={quietButton}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ),
      )}

      {editing === "new" ? (
        <AddressForm onDone={() => setEditing(null)} />
      ) : (
        addresses.length < MAX && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-4 text-sm text-white/60 transition-colors hover:border-white/30 hover:text-white"
          >
            <Plus className="h-4 w-4" /> Add an address
          </button>
        )
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
