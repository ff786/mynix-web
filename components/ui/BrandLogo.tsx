import Image from "next/image";
import { cn } from "@/utils/cn";

/**
 * MYNIX lockup: the official gold mark beside the wordmark. The wordmark takes
 * the surrounding text colour, so it follows the navbar's light/dark theme;
 * the gold mark reads on both.
 */
export default function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/mynix-mark.png"
        alt=""
        width={480}
        height={253}
        priority={priority}
        className="h-[22px] w-auto select-none"
        draggable={false}
      />
      <span className="text-[15px] font-semibold uppercase tracking-[0.42em]">Mynix</span>
    </span>
  );
}
