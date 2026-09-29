import Link from "next/link";
import type { Product } from "@/types/product";
import { cn } from "@/utils/cn";
import { formatLkr } from "@/utils/money";

type VariantPickerProps = {
  current: Product;
  /** All options of the variable product, sorted (including `current`). */
  options: Product[];
  /** Quick view: switch in place. */
  onSelect?: (product: Product) => void;
  /** Product page: link to each option's own page. */
  asLinks?: boolean;
  className?: string;
};

/** Option buttons for a variable product ("Colour: Black"), with prices when they differ. */
export default function VariantPicker({ current, options, onSelect, asLinks, className }: VariantPickerProps) {
  if (options.length < 2 || !current.variant) return null;

  const showPrices = options.some((p) => p.price !== options[0].price);
  const chip = (option: Product) =>
    cn(
      "inline-flex min-h-11 flex-col items-center justify-center rounded-xl border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      option.id === current.id
        ? "border-white bg-white text-[#1d1d1f]"
        : "border-white/15 text-white/75 hover:border-white/40 hover:text-white",
      !option.inStock && option.id !== current.id && "text-white/40",
    );
  const content = (option: Product) => (
    <>
      <span className={cn("font-medium", !option.inStock && "line-through decoration-1")}>{option.variant?.label}</span>
      {showPrices && <span className="text-[11px] tabular-nums opacity-70">{formatLkr(option.price)}</span>}
    </>
  );
  const label = (option: Product) =>
    `${option.variant?.optionName}: ${option.variant?.label}${option.inStock ? "" : " (sold out)"}`;

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">
        {current.variant.optionName}: <span className="text-white/85">{current.variant.label}</span>
      </p>
      <ul role="list" className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <li key={option.id}>
            {asLinks ? (
              <Link
                href={`/products/${option.id}`}
                replace
                scroll={false}
                aria-label={label(option)}
                aria-current={option.id === current.id ? "page" : undefined}
                className={chip(option)}
              >
                {content(option)}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onSelect?.(option)}
                aria-label={label(option)}
                aria-pressed={option.id === current.id}
                className={chip(option)}
              >
                {content(option)}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
