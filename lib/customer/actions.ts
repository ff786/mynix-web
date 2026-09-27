"use server";

import { z } from "zod";
import {
  clearCustomerSession,
  clearVerification,
  customerAccountsEnabled,
  getVerification,
  setCustomerSession,
  setVerification,
  type VerifyPurpose,
} from "@/lib/customer/session";
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

/** Finishes sign-in / sign-up after the number was verified (name only for new customers). */
export async function completeSignIn(input: { name?: string }): Promise<Result<{ name: string }>> {
  if (!customerAccountsEnabled) return { ok: false, error: "Accounts are not available yet." };
  const verification = await getVerification("ACCOUNT");
  if (!verification) return { ok: false, error: "Your code has expired. Please request a new one." };

  const name = (input.name ?? "").trim().slice(0, 150) || undefined;
  try {
    const customer = await posRequest<Customer>("/store/customers/sign-in", {
      method: "POST",
      body: { verificationToken: verification.token, name },
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

export async function signOut(): Promise<void> {
  await clearCustomerSession();
}
