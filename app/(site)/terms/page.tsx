import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SHOP_ADDRESS, WHATSAPP_DISPLAY } from "@/utils/whatsapp";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms for buying gemology tools and equipment from MYNIX (PVT) LTD online and by phone or WhatsApp.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="29 September 2026">
      <section>
        <p>
          These terms apply when you buy from MYNIX (PVT) LTD (&ldquo;MYNIX&rdquo;, &ldquo;we&rdquo;) through mynix.lk,
          by phone or on WhatsApp. By placing an order you agree to them. They are governed by the laws of Sri Lanka.
        </p>
      </section>

      <section>
        <h2>Products and prices</h2>
        <ul>
          <li>All prices are in Sri Lankan Rupees (LKR). Any delivery fee is shown before you confirm your order.</li>
          <li>
            Stock is shared with our shop in Beruwala and checked when you place your order. If an item sells out
            before we pack it, we will contact you and refund or cancel that part of the order.
          </li>
          <li>Product photos are for illustration. Small differences in colour or packaging can occur.</li>
          <li>If a price is shown incorrectly because of an obvious error, we may cancel the order and tell you before dispatch.</li>
        </ul>
      </section>

      <section>
        <h2>Ordering</h2>
        <ul>
          <li>You must verify your Sri Lankan mobile number with a one-time SMS code to order.</li>
          <li>
            Your order is confirmed when you receive an order number. We send SMS updates when it is dispatched,
            delivered or cancelled.
          </li>
          <li>We may refuse or cancel orders that look fraudulent or that we cannot deliver.</li>
        </ul>
      </section>

      <section>
        <h2>Payment</h2>
        <ul>
          <li>
            <strong className="text-white/85">Cash on delivery:</strong> pay the courier in cash when your order
            arrives. Please have the exact amount ready.
          </li>
          <li>
            <strong className="text-white/85">Card payments</strong> are coming soon. They will be processed by a
            licensed payment gateway; we never see or store your card details.
          </li>
          <li>
            Orders placed by phone or WhatsApp may also be paid by bank transfer before dispatch, using the account our
            staff give you.
          </li>
        </ul>
      </section>

      <section>
        <h2>Delivery</h2>
        <ul>
          <li>We deliver within Sri Lanka only.</li>
          <li>Delivery times are estimates and can vary by location and courier.</li>
          <li>
            Please check your parcel when it arrives. If it is damaged or incorrect, tell the courier and contact us
            within 48 hours with photos.
          </li>
          <li>You can follow your order on the <Link href="/track">track order</Link> page.</li>
        </ul>
      </section>

      <section>
        <h2>Cancellations, returns and refunds</h2>
        <ul>
          <li>You can cancel free of charge before your order is dispatched. Contact us as soon as possible.</li>
          <li>
            Items that arrive faulty, damaged or not as ordered will be replaced or refunded once we confirm the issue.
            Report it within 7 days of delivery.
          </li>
          <li>
            Other returns are accepted at our discretion within 7 days, if the item is unused and in its original
            packaging. You may be asked to cover the return delivery cost.
          </li>
          <li>For precision instruments, opened consumables and custom orders, returns are limited to manufacturing defects.</li>
          <li>Approved refunds are made by the original payment method or bank transfer, usually within 14 days.</li>
        </ul>
      </section>

      <section>
        <h2>Warranty and use</h2>
        <p>
          Manufacturer warranties apply where stated on the product. Our tools are intended for trained use. MYNIX is not
          liable for losses caused by misuse, or for indirect losses, to the extent the law allows. Nothing in these terms
          limits your rights under the Consumer Affairs Authority Act, No. 9 of 2003.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <p>
          Keep access to your mobile number secure, as it is used to sign in. Your personal information is handled as
          described in our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>Contact us</h2>
        <p>
          MYNIX (PVT) LTD, {SHOP_ADDRESS}.
          <br />
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or call / WhatsApp{" "}
          <a href={`tel:${WHATSAPP_DISPLAY.replace(/\s/g, "")}`}>{WHATSAPP_DISPLAY}</a>.
        </p>
        <p>We may update these terms. Orders are governed by the terms in force when they were placed.</p>
      </section>
    </LegalPage>
  );
}
