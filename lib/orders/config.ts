import "server-only";

/**
 * Flat delivery fee in LKR (DELIVERY_FEE_LKR). A placeholder until courier
 * rates are decided; 0 means free delivery.
 */
export function deliveryFee(): number {
  const fee = Number(process.env.DELIVERY_FEE_LKR ?? 0);
  return Number.isFinite(fee) && fee >= 0 && fee <= 20_000 ? fee : 0;
}

/**
 * Bank account details shown to customers who choose bank transfer
 * (BANK_TRANSFER_DETAILS, lines separated by "\n"). Bank transfer is only
 * offered when this is set.
 */
export function bankTransferDetails(): string | null {
  const details = process.env.BANK_TRANSFER_DETAILS?.replace(/\\n/g, "\n").trim();
  return details || null;
}
