import "server-only";

/**
 * Flat delivery fee in LKR (DELIVERY_FEE_LKR). A placeholder until courier
 * rates are decided; 0 means free delivery.
 */
export function deliveryFee(): number {
  const fee = Number(process.env.DELIVERY_FEE_LKR ?? 0);
  return Number.isFinite(fee) && fee >= 0 && fee <= 20_000 ? fee : 0;
}

