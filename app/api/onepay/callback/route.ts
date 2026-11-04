import { NextResponse, type NextRequest } from "next/server";
import { finalizeCardPayment, findParkedPending } from "@/lib/payments/card";
import { limited } from "@/lib/rate-limit";
import { isAuthenticCallback, readOnePayCallback } from "@/lib/payments/webhook";

/**
 * OnePay's server-to-server callback. It must carry our Callback Token, and even
 * then it is only a hint: order details come from the sealed POS record, and
 * payment is confirmed with OnePay directly.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(`onepay-webhook:${ip}`, 60, 10)) return NextResponse.json({ ok: false }, { status: 429 });

  if (!isAuthenticCallback(request.headers.get("authorization"), process.env.ONEPAY_CALLBACK_TOKEN?.trim() ?? "")) {
    console.warn("[payments] Rejected a webhook without the correct Callback Token.");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const parsed = await readOnePayCallback(request);
  if (!parsed.ok) return NextResponse.json({ ok: false }, { status: parsed.status });
  const body = parsed.callback;
  const transactionId = body.transaction_id;

  // Only a success notice is worth acting on (a failed or cancelled one finishes nothing).
  const success = body.status === 1 || body.status_message === "SUCCESS";
  if (!success) return NextResponse.json({ ok: true });

  let pending;
  try {
    pending = await findParkedPending(transactionId);
  } catch (error) {
    console.error("[payments] Webhook couldn't reach the POS to find the order:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false }, { status: 500 }); // OnePay can try again
  }
  // Nothing parked: already finished (the customer came back), expired, or not ours.
  if (!pending) return NextResponse.json({ ok: true });

  let result;
  try {
    result = await finalizeCardPayment(pending, transactionId);
  } catch (error) {
    console.error("[payments] Webhook finalization failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  // A temporary failure answers 500 so OnePay can try again; a finished or unpaid one is final.
  return NextResponse.json({ ok: result.kind === "placed" || result.kind === "unpaid" }, {
    status: result.kind === "retry" || result.kind === "paid-unplaced" ? 500 : 200,
  });
}
