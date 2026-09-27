import Button from "@/components/ui/Button";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { getWhatsAppGeneralUrl } from "@/utils/whatsapp";

/** Shown when the catalogue can't be loaded right now. */
export default function StoreUnavailable() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <p className="text-lg font-semibold text-white/80">The shop is taking a short break.</p>
      <p className="mt-2 max-w-sm text-sm text-white/50">
        Please check back in a few minutes, or message the MYNIX team and we&apos;ll help you right away.
      </p>
      <Button href={getWhatsAppGeneralUrl()} external size="sm" className="mt-6">
        <WhatsAppIcon className="h-4 w-4" />
        Ask on WhatsApp
      </Button>
    </div>
  );
}
