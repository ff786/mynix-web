import type { Metadata } from "next";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <Link href="/admin" className="text-sm text-ink/50 transition-colors hover:text-ink">
        ← All products
      </Link>
      <h1 className="mb-10 mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Add product</h1>
      <ProductForm nextSortOrder={(data?.sort_order ?? 0) + 10} />
    </>
  );
}
