import "server-only";
import { getCustomerSession } from "@/lib/customer/session";
import { posRequest } from "@/lib/pos/client";

export type DeliveryAddress = {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  district: string;
  postalCode?: string | null;
};

export type CustomerProfile = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  lastDeliveryAddress: DeliveryAddress | null;
};

/** The signed-in customer's details from the POS, or null (signed out, removed, or POS unreachable). */
export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const session = await getCustomerSession();
  if (!session) return null;
  try {
    return await posRequest<CustomerProfile>(`/store/customers/${session.customerId}`);
  } catch {
    return null;
  }
}
