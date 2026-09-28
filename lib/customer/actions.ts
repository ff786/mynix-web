"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  clearCustomerSession,
  clearVerification,
  customerAccountsEnabled,
  getCustomerSession,
  getVerification,
  setCustomerSession,
  setVerification,
  type VerifyPurpose,
} from "@/lib/customer/session";
import { DISTRICTS } from "@/lib/districts";
import { mobileSchema } from "@/lib/phone";
import { PosError, posRequest } from "@/lib/pos/client";
import { limited, visitorKey } from "@/lib/rate-limit";

/**
 * Phone verification by SMS code (checkout and customer accounts). Codes are
 * created, sent and checked by the POS; the resulting single-use proof is
 * kept in a signed HttpOnly cookie, never in the browser's JavaScript.
 */

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const purposeSchema = z.enum(["CHECKOUT", "ACCOUNT"]);

export async function sendVerificationCode(input: { phone: string; purpose: VerifyPurpose }): Promise<Result> {
  const phone = mobileSchema.safeParse(input.phone);
  const purpose = purposeSchema.safeParse(input.purpose);
  if (!phone.success) return { ok: false, error: phone.error.issues[0].message };
  if (!purpose.success) return { ok: false, error: "Something went wrong." };
  if (purpose.data === "ACCOUNT" && !customerAccountsEnabled) return { ok: false, error: "Accounts are not available yet." };

  if (limited(`sms:${await visitorKey()}`, 8, 60)) {
    return { ok: false, error: "Too many codes requested. Please try again later." };
  }

  try {
    const { status } = await posRequest<{ status: "SENT" | "TOO_SOON" | "TOO_MANY" }>("/store/verification/send", {
      method: "POST",
      body: { phone: phone.data, purpose: purpose.data },
    });
    if (status === "TOO_SOON") return { ok: false, error: "A code was just sent. Please wait a minute before asking again." };
    if (status === "TOO_MANY") return { ok: false, error: "Too many codes for this number. Please try again in an hour." };
    return { ok: true };
  } catch (error) {
    console.error("[verify] Sending code failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "We couldn't send a code right now. Please try again shortly." };
  }
}

type CheckResult = Result<{ accountExists: boolean; existingCustomerName: string | null }>;

export async function checkVerificationCode(input: { phone: string; code: string; purpose: VerifyPurpose }): Promise<CheckResult> {
  const phone = mobileSchema.safeParse(input.phone);
  const purpose = purposeSchema.safeParse(input.purpose);
  const code = String(input.code ?? "").replace(/\s+/g, "");
  if (!phone.success || !purpose.success || !/^\d{6}$/.test(code)) {
    return { ok: false, error: "Enter the 6-digit code from the SMS." };
  }
  if (limited(`check:${await visitorKey()}`, 20, 30)) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  try {
    const result = await posRequest<{
      status: "VERIFIED" | "INVALID";
      verificationToken?: string;
      accountExists?: boolean;
      existingCustomerName?: string | null;
    }>("/store/verification/check", { method: "POST", body: { phone: phone.data, purpose: purpose.data, code } });

    if (result.status !== "VERIFIED" || !result.verificationToken) {
      return { ok: false, error: "That code didn't work. Check the SMS, or ask for a new code." };
    }
    await setVerification(purpose.data, { token: result.verificationToken, phone: phone.data });
    return { ok: true, accountExists: !!result.accountExists, existingCustomerName: result.existingCustomerName ?? null };
  } catch (error) {
    console.error("[verify] Checking code failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "We couldn't check the code right now. Please try again." };
  }
}

type Customer = { id: number; name: string; phone: string };

const emailSchema = z.email("Enter a valid email address.").max(254);

/**
 * Finishes sign-in / sign-up after the number was verified. New accounts
 * need an email (and a name if the shop doesn't know the number yet).
 */
export async function completeSignIn(input: { name?: string; email?: string }): Promise<Result<{ name: string }>> {
  if (!customerAccountsEnabled) return { ok: false, error: "Accounts are not available yet." };
  const verification = await getVerification("ACCOUNT");
  if (!verification) return { ok: false, error: "Your code has expired. Please request a new one." };

  const name = (input.name ?? "").trim().slice(0, 150) || undefined;
  const rawEmail = (input.email ?? "").trim();
  const email = rawEmail ? emailSchema.safeParse(rawEmail) : null;
  if (email && !email.success) return { ok: false, error: email.error.issues[0].message };
  try {
    const customer = await posRequest<Customer>("/store/customers/sign-in", {
      method: "POST",
      body: { verificationToken: verification.token, name, email: email?.data },
    });
    await clearVerification("ACCOUNT");
    await setCustomerSession({ customerId: customer.id, phone: customer.phone, name: customer.name });
    return { ok: true, name: customer.name };
  } catch (error) {
    if (error instanceof PosError && error.status === 400) return { ok: false, error: error.message };
    console.error("[account] Sign-in failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "We couldn't sign you in right now. Please try again." };
  }
}

// --- profile manager (signed-in customers only) --------------------------------

async function requireSession() {
  const session = await getCustomerSession();
  if (!session) throw new PosError(401, "Please sign in again.");
  return session;
}

const failure = (error: unknown, fallback: string) =>
  ({
    ok: false,
    error: error instanceof PosError && [400, 401, 404].includes(error.status) ? error.message : fallback,
  }) as const;

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(150),
  email: emailSchema,
});

export async function updateProfile(input: { name: string; email: string }): Promise<Result> {
  const parsed = profileSchema.safeParse({ name: input.name, email: (input.email ?? "").trim() });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const session = await requireSession();
    const customer = await posRequest<Customer>(`/store/customers/${session.customerId}`, {
      method: "PATCH",
      body: parsed.data,
    });
    await setCustomerSession({ ...session, name: customer.name });
    revalidatePath("/account");
    return { ok: true };
  } catch (error) {
    return failure(error, "We couldn't save your details. Please try again.");
  }
}

const addressSchema = z.object({
  label: z.string().trim().min(1, "Give the address a name, e.g. Home.").max(40),
  addressLine1: z.string().trim().min(1, "Enter the address.").max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, "Enter the city.").max(100),
  district: z.enum(DISTRICTS, "Choose a district."),
  postalCode: z.string().trim().max(20).optional(),
  makeDefault: z.boolean().optional(),
});
export type AddressInput = z.input<typeof addressSchema>;

export async function saveAddress(input: AddressInput, addressId?: number): Promise<Result> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const session = await requireSession();
    const base = `/store/customers/${session.customerId}/addresses` as const;
    await posRequest(addressId ? `${base}/${Number(addressId)}` : base, {
      method: addressId ? "PUT" : "POST",
      body: { ...parsed.data, makeDefault: !!parsed.data.makeDefault },
    });
    revalidatePath("/account");
    return { ok: true };
  } catch (error) {
    return failure(error, "We couldn't save the address. Please try again.");
  }
}

export async function deleteAddress(addressId: number): Promise<Result> {
  try {
    const session = await requireSession();
    await posRequest(`/store/customers/${session.customerId}/addresses/${Number(addressId)}`, { method: "DELETE" });
    revalidatePath("/account");
    return { ok: true };
  } catch (error) {
    return failure(error, "We couldn't remove the address.");
  }
}

export async function makeDefaultAddress(addressId: number): Promise<Result> {
  try {
    const session = await requireSession();
    await posRequest(`/store/customers/${session.customerId}/addresses/${Number(addressId)}/default`, {
      method: "POST",
    });
    revalidatePath("/account");
    return { ok: true };
  } catch (error) {
    return failure(error, "We couldn't update the default address.");
  }
}

/** Closes the website account (sign-in and saved addresses); the shop record stays. */
export async function closeAccount(): Promise<Result> {
  try {
    const session = await requireSession();
    await posRequest(`/store/customers/${session.customerId}/account`, { method: "DELETE" });
    await clearCustomerSession();
    return { ok: true };
  } catch (error) {
    return failure(error, "We couldn't close your account. Please contact us.");
  }
}

export async function signOut(): Promise<void> {
  await clearCustomerSession();
}
