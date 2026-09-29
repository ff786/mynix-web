"use client";

import { setConsent } from "@/components/consent/consentStore";

/** Footer link that clears the saved choice, so the banner asks again. */
export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => setConsent(null)} className={className}>
      Cookie settings
    </button>
  );
}
