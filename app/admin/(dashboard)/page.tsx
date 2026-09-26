import type { Metadata } from "next";
import { Plus } from "lucide-react";
import ProductTable from "@/components/admin/ProductTable";
import Button from "@/components/ui/Button";
import { requireAdmin } from "@/lib/admin/auth";
import type { ProductRow } from "@/types/product";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin">) {
  const { supabase } = await requireAdmin();
  const { saved, deleted, twostep, password } = await searchParams;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const products = (data ?? []) as ProductRow[];
  const notice =
    typeof saved === "string"
      ? `Saved “${saved}”. Changes are live on the website.`
      : typeof deleted === "string"
        ? `Deleted “${deleted}”. Changes are live on the website.`
        : twostep === "on"
          ? "Two-step sign-in is on. You'll need a code from your authenticator app each time you sign in."
          : password === "changed"
            ? "Your password has been changed."
            : null;

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Products</h1>
          <p className="mt-2 text-ink/60">
            {products.length} products · {products.filter((p) => p.published).length} live on the site
          </p>
        </div>
        <Button href="/admin/products/new" size="md">
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>

      {notice && (
        <p role="status" className="mt-8 rounded-2xl border border-ink/10 bg-white px-5 py-3.5 text-sm text-ink/80">
          {notice}
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Couldn&apos;t load products: {error.message}. Has <code>supabase/schema.sql</code> been run?
        </p>
      ) : (
        <ProductTable products={products} />
      )}
    </>
  );
}
