import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SHOP_ADDRESS, WHATSAPP_DISPLAY } from "@/utils/whatsapp";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MYNIX (PVT) LTD collects, uses and protects your personal information when you shop with us.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="29 September 2026">
      <section>
        <p>
          This policy explains how MYNIX (PVT) LTD (&ldquo;MYNIX&rdquo;, &ldquo;we&rdquo;) handles your personal
          information when you visit mynix.lk, place an order, create an account or shop with us by phone or WhatsApp.
          We follow Sri Lanka&apos;s Personal Data Protection Act, No. 9 of 2022.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, mobile number and (optionally) email address.</li>
          <li>Delivery addresses you give us, including any you save to your account.</li>
          <li>Your orders: items, amounts, payment method, delivery status and notes.</li>
          <li>
            Technical details needed to run the site safely, such as your IP address for rate limiting and fraud
            prevention.
          </li>
          <li>If you subscribe to our newsletter, your email address.</li>
        </ul>
        <p>We do not collect or store card numbers on this website.</p>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To verify your mobile number with a one-time SMS code.</li>
          <li>To process, deliver and support your orders, and to keep accounting and tax records.</li>
          <li>To send order updates by SMS (placed, dispatched, delivered, cancelled).</li>
          <li>To link your online account to your existing MYNIX shop customer record, so your history stays in one place.</li>
          <li>To send newsletters, only if you subscribed. You can unsubscribe at any time.</li>
          <li>With your consent only, to measure site visits anonymously so we can improve the site.</li>
        </ul>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>We never sell your information. We share only what is needed with the service providers that run our business:</p>
        <ul>
          <li>Amazon Web Services (our servers and database, Mumbai region).</li>
          <li>Vercel (website hosting) and Cloudflare (security and network).</li>
          <li>Text.lk (SMS delivery in Sri Lanka).</li>
          <li>Courier partners, who receive your name, phone number and delivery address.</li>
        </ul>
        <p>We may also disclose information when the law requires it.</p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <ul>
          <li>
            <strong className="text-white/85">Essential:</strong> a secure sign-in cookie, a short-lived cookie
            confirming your verified mobile number during checkout, your cart (kept in your browser) and your cookie
            choice. The site cannot work without these.
          </li>
          <li>
            <strong className="text-white/85">Analytics (optional):</strong> privacy-friendly visit statistics that
            don&apos;t use tracking cookies or identify you. They only run if you choose &ldquo;Accept&rdquo; on the
            cookie banner. You can change your choice from the &ldquo;Cookie settings&rdquo; link in the footer.
          </li>
        </ul>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          Order and invoice records are kept as long as Sri Lankan tax and accounting law requires. Verification codes
          expire within minutes. If you close your account, we remove your online sign-in and saved addresses; order
          records we must keep by law remain in our shop system.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can view and update your details and saved addresses in{" "}
          <Link href="/account">your account</Link>, close your account there, and ask us for a copy of your information,
          to correct it, or to delete what we don&apos;t need to keep. You can withdraw consent for newsletters and
          analytics at any time.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          All traffic is encrypted with HTTPS. Sign-in uses one-time SMS codes rather than passwords, sessions are signed,
          and access to our systems is restricted to authorised staff.
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
        <p>We may update this policy. The date at the top shows the latest version.</p>
      </section>
    </LegalPage>
  );
}
