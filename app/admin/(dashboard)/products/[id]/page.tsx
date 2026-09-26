import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin/auth";
import type { ProductRow } from "@/types/product";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const product = data as ProductRow;

  return (
    <>
      <Link href="/admin" className="text-sm text-ink/50 transition-colors hover:text-ink">
        ← All products
      </Link>
      <h1 className="mb-10 mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
      <ProductForm product={product} />
    </>
  );
}
