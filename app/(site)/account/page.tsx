import type { Metadata } from "next";
import Link from "next/link";
import EmailEditor from "@/components/customer/EmailEditor";
import SignInForm from "@/components/customer/SignInForm";
import SignOutButton from "@/components/customer/SignOutButton";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import { getCustomerProfile, type CustomerProfile } from "@/lib/customer/profile";
import { customerAccountsEnabled, getCustomerSession } from "@/lib/customer/session";
import type { OrderSummary } from "@/lib/orders/actions";
import { formatMobile } from "@/lib/phone";
import { posRequest } from "@/lib/pos/client";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

/** Only paths on this site, so the sign-in can't bounce visitors elsewhere. */
const safeNext = (value: unknown) => (typeof value === "string" && /^\/[a-z0-9/-]*$/.test(value) ? value : "/account");

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const { next, phone } = await searchParams;
  const session = await getCustomerSession();

  let orders: OrderSummary[] | null = null;
  let customer: CustomerProfile | null = null;
  if (session) {
    // Account removed/deactivated in the POS, or POS unreachable: fall back to sign-in.
    customer = await getCustomerProfile();
    orders = customer
      ? await posRequest<OrderSummary[]>(`/store/customers/${session.customerId}/orders`).catch(() => null)
      : null;
  }
  const initialPhone = typeof phone === "string" ? phone.replace(/[^0-9+ ]/g, "").slice(0, 20) : undefined;

  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter text-white/90 sm:text-6xl">Your account</h1>

        {customer && orders ? (
          <>
            <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
              <p className="text-white/70">
                {customer.name} · {formatMobile(customer.phone)}
              </p>
              <SignOutButton />
            </div>
            <div className="mt-3">
              <EmailEditor initialEmail={customer.email} />
            </div>

            <h2 className="mt-12 text-xs uppercase tracking-[0.25em] text-white/45">Your orders</h2>
            {orders.length === 0 ? (
              <p className="mt-4 text-white/60">
                No online orders yet.{" "}
                <Link href="/catalog" className="underline underline-offset-4 hover:text-white">
                  Browse the catalog
                </Link>
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                {orders.map((order) => (
                  <OrderSummaryCard key={order.invoiceNumber} order={order} />
                ))}
              </div>
            )}
          </>
        ) : !customerAccountsEnabled ? (
          <p className="mt-8 text-white/60">Customer accounts are coming soon.</p>
        ) : (
          <>
            <p className="mt-4 text-white/60">
              Sign in or create an account with your mobile number — we&apos;ll text you a code. No password
              needed. Shop customers: use the number you give us in store.
            </p>
            <div className="mt-10">
              <SignInForm next={safeNext(next)} initialPhone={initialPhone} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
