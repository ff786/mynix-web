import { NextResponse } from "next/server";
import { clearVerification } from "@/lib/customer/session";
import { clearPending, finalizeCardPayment, readPending, rememberReceipt } from "@/lib/payments/card";
import { limited, visitorKey } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";

/**
 * Where OnePay sends the customer after the payment page. Nothing in the address
 * is trusted: the payment is confirmed with OnePay itself, using the transaction
 * id this server stored in the customer's sealed cookie.
 */
export const dynamic = "force-dynamic";

// Built from SITE_URL, never from the request: behind a proxy or tunnel the request's own
// address is the internal one (e.g. https://localhost:3001), which browsers can't reach.
const page = (query: string) => NextResponse.redirect(new URL(`/checkout/payment?${query}`, SITE_URL), 303);
const to = (state: string) => page(`state=${state}`);

export async function GET() {
  // Without the cookie (another browser, or expired) the webhook still finishes a paid order.
  const stored = await readPending();
  if (!stored) return to("unknown");

  if (limited(`card-return:${await visitorKey()}`, 20, 10)) return to("retry");

  const result = await finalizeCardPayment(stored.pending, stored.transactionId);
  switch (result.kind) {
    case "placed": {
      await rememberReceipt(result.order.invoiceNumber, result.phone);
      await clearPending();
      if ("verificationToken" in stored.pending.identity) await clearVerification("CHECKOUT");
      return to("paid");
    }
    case "unpaid":
      return to("failed");
    case "paid-unplaced":
      await clearPending();
      return page(`state=paid-unplaced&ref=${encodeURIComponent(stored.transactionId)}`);
    case "retry":
      return to("retry");
  }
}
