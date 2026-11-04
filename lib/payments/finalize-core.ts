export type OrderPlacement<Order> = { ok: true; order: Order } | { ok: false; error: string; detail?: string };

export type PaymentFinalization<Order> =
  | { kind: "placed"; order: Order; phone: string }
  | { kind: "unpaid" }
  | { kind: "paid-unplaced"; requestId: string }
  | { kind: "retry" };

/**
 * Shared, dependency-injected finalization sequence. The pending record is only
 * cleaned up after order placement succeeds; a paid POS failure stays recoverable.
 */
export async function runPaymentFinalization<Order>(input: {
  requestId: string;
  phone: string;
  confirmPayment: () => Promise<boolean>;
  isRetryableConfirmationError: (error: unknown) => boolean;
  createOrder: () => Promise<OrderPlacement<Order>>;
  onPaidUnplaced: (reason: string) => Promise<void>;
  onPlaced: (order: Order) => Promise<void>;
}): Promise<PaymentFinalization<Order>> {
  try {
    if (!(await input.confirmPayment())) return { kind: "unpaid" };
  } catch (error) {
    if (input.isRetryableConfirmationError(error)) return { kind: "retry" };
    throw error;
  }

  let placement: OrderPlacement<Order>;
  try {
    placement = await input.createOrder();
  } catch (error) {
    placement = {
      ok: false,
      error: error instanceof Error ? error.message : "Order creation failed.",
    };
  }

  if (!placement.ok) {
    await input.onPaidUnplaced(placement.detail ?? placement.error).catch(() => undefined);
    return { kind: "paid-unplaced", requestId: input.requestId };
  }

  await input.onPlaced(placement.order).catch(() => undefined);
  return { kind: "placed", order: placement.order, phone: input.phone };
}
