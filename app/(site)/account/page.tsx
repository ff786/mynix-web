import type { Metadata } from "next";
import Link from "next/link";
import AddressBook from "@/components/customer/AddressBook";
import CloseAccount from "@/components/customer/CloseAccount";
import ProfileForm from "@/components/customer/ProfileForm";
import SignInForm from "@/components/customer/SignInForm";
import SignOutButton from "@/components/customer/SignOutButton";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import { getCustomerProfile, getSavedAddresses } from "@/lib/customer/profile";
import { customerAccountsEnabled, getCustomerSession } from "@/lib/customer/session";
import type { OrderSummary } from "@/lib/orders/actions";
import { posRequest } from "@/lib/pos/client";
import { cn } from "@/utils/cn";

export const metadata: Metadata = {
  title: "Your Account",
  description: "Sign in with your mobile number to manage your details, saved addresses and MYNIX orders.",
  robots: { index: false },
};

/** Only paths on this site, so the sign-in can't bounce visitors elsewhere. */
const safeNext = (value: unknown) => (typeof value === "string" && /^\/[a-z0-9/-]*$/.test(value) ? value : "/account");

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "addresses", label: "Addresses" },
  { id: "orders", label: "Orders" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const { next, phone, tab: tabParam } = await searchParams;
  const session = await getCustomerSession();
  const customer = session ? await getCustomerProfile() : null;
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : "profile";
  const initialPhone = typeof phone === "string" ? phone.replace(/[^0-9+ ]/g, "").slice(0, 20) : undefined;

  return (
    <main data-theme="dark" data-section-bg="#050505" className="min-h-screen px-6 pb-24 pt-36 sm:px-10 sm:pt-44">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold uppercase tracking-tighter text-white/90 sm:text-6xl">Your account</h1>

        {customer ? (
          <>
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
              <p className="text-white/60">Hello, {customer.name.split(" ")[0]}.</p>
              <SignOutButton />
            </div>

            <nav aria-label="Account sections" className="mt-10 flex gap-2 border-b border-white/10">
              {TABS.map(({ id, label }) => (
                <Link
                  key={id}
                  href={`/account?tab=${id}`}
                  aria-current={tab === id ? "page" : undefined}
                  className={cn(
                    "-mb-px border-b-2 px-4 pb-3 text-sm transition-colors",
                    tab === id ? "border-white text-white" : "border-transparent text-white/50 hover:text-white",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-10">
              {tab === "profile" && (
                <div className="space-y-16">
                  <ProfileForm name={customer.name} email={customer.email} phone={customer.phone} />
                  <section className="border-t border-white/10 pt-8">
                    <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-white/45">Account</h2>
                    <CloseAccount />
                  </section>
                </div>
              )}
              {tab === "addresses" && <AddressBook addresses={await getSavedAddresses()} />}
              {tab === "orders" && <Orders customerId={customer.id} />}
            </div>
          </>
        ) : !customerAccountsEnabled ? (
          <p className="mt-8 text-white/60">Customer accounts are coming soon.</p>
        ) : (
          <>
            <p className="mt-4 text-white/60">
              Sign in or create an account with your mobile number — we&apos;ll text you a code. No password needed. Shop
              customers: use the number you give us in store.
            </p>
            <div className="mt-10 max-w-lg">
              <SignInForm next={safeNext(next)} initialPhone={initialPhone} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

async function Orders({ customerId }: { customerId: number }) {
  const orders = await posRequest<OrderSummary[]>(`/store/customers/${customerId}/orders`).catch(() => null);
  if (!orders) return <p className="text-white/60">We couldn&apos;t load your orders right now.</p>;
  if (orders.length === 0) {
    return (
      <p className="text-white/60">
        No online orders yet.{" "}
        <Link href="/catalog" className="underline underline-offset-4 hover:text-white">
          Browse the catalog
        </Link>
      </p>
    );
  }
  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <OrderSummaryCard key={order.invoiceNumber} order={order} />
      ))}
    </div>
  );
}
