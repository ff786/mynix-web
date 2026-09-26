"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import { Field, inputClasses } from "@/components/admin/fields";
import ImageField from "@/components/admin/ImageField";
import { buttonClasses } from "@/components/ui/Button";
import { CATEGORIES } from "@/data/products";
import type { ProductRow } from "@/types/product";
import { cn } from "@/utils/cn";

type ProductFormProps = {
  /** Existing product when editing; omitted when adding. */
  product?: ProductRow;
  /** Suggested position for a new product (end of the list). */
  nextSortOrder?: number;
};

export default function ProductForm({ product, nextSortOrder = 0 }: ProductFormProps) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [sku, setSku] = useState(product?.sku ?? "");
  const errors = state.fieldErrors ?? {};

  return (
    <form
      // Submitted manually: React resets a <form action> after it runs, which
      // would wipe the fields whenever validation sends errors back.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-10"
    >
      {product && <input type="hidden" name="id" value={product.id} />}

      <Section title="Basics">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Product name" htmlFor="name" error={errors.name}>
            <input id="name" name="name" required defaultValue={product?.name} className={inputClasses} />
          </Field>
          <Field
            label="Product code"
            htmlFor="sku"
            error={errors.sku}
            hint="Internal ID — included in WhatsApp inquiries, not shown on the site."
          >
            <input
              id="sku"
              name="sku"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="MNX-TRC-18"
              className={cn(inputClasses, "font-mono uppercase")}
            />
          </Field>
          <Field label="Category" htmlFor="category" error={errors.category}>
            <select id="category" name="category" required defaultValue={product?.category ?? ""} className={inputClasses}>
              <option value="" disabled>
                Choose…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Display order"
            htmlFor="sort_order"
            error={errors.sort_order}
            hint="Lower numbers appear first."
          >
            <input
              id="sort_order"
              name="sort_order"
              type="number"
              step={1}
              defaultValue={product?.sort_order ?? nextSortOrder}
              className={inputClasses}
            />
          </Field>
        </div>
        <Field
          label="Short description"
          htmlFor="description"
          error={errors.description}
          hint="One or two sentences, shown on the product card."
        >
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={400}
            defaultValue={product?.description}
            className={inputClasses}
          />
        </Field>
      </Section>

      <Section title="Details">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Key features" htmlFor="features" hint="One per line — shown in Quick Specs.">
            <textarea
              id="features"
              name="features"
              rows={6}
              defaultValue={product?.features.join("\n")}
              placeholder={"10x magnification\nFolding protective housing"}
              className={inputClasses}
            />
          </Field>
          <Field
            label="Options"
            htmlFor="variants"
            hint="Optional. One per line (sizes, grits, colours) — customers can pick one."
          >
            <textarea
              id="variants"
              name="variants"
              rows={6}
              defaultValue={product?.variants.join("\n")}
              placeholder={"#180\n#260\n#400"}
              className={inputClasses}
            />
          </Field>
        </div>
      </Section>

      <Section title="Photo">
        <ImageField defaultValue={product?.image ?? null} sku={sku} />
      </Section>

      <Section title="Visibility">
        <div className="space-y-4">
          <Checkbox
            name="published"
            defaultChecked={product?.published ?? true}
            label="Show on the website"
            hint="Untick to hide it without deleting."
          />
          <Checkbox
            name="flagship"
            defaultChecked={product?.flagship ?? false}
            label="Flagship product"
            hint="Featured in the hero's “Order the kit” button and the Flagship section. Only one product can be the flagship."
          />
        </div>
      </Section>

      {state.error && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-red-700">
          Please fix the highlighted fields.
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-ink/10 pt-8">
        <button type="submit" disabled={pending} className={buttonClasses({ size: "lg" })}>
          {pending ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
        <Link href="/admin" className={buttonClasses({ variant: "secondary", size: "lg" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
      <h2 className="mb-6 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-ink/30 accent-[#1c2e4a]"
      />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-ink/55">{hint}</span>
      </span>
    </label>
  );
}
