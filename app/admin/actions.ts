"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { isStoragePath } from "@/lib/images";
import { PRODUCT_IMAGES_BUCKET, PRODUCTS_TAG, isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CATEGORY_IDS, type CategoryId } from "@/types/product";

/* -------------------------------------------------------------------------- */
/*  Auth                                                                       */
/* -------------------------------------------------------------------------- */

export type LoginState = { error?: string; email?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured) return { error: "Supabase isn't configured yet — see ADMIN_SETUP.md." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password.", email };

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* -------------------------------------------------------------------------- */
/*  Products                                                                   */
/* -------------------------------------------------------------------------- */

export type ProductFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"sku" | "name" | "category" | "description" | "sort_order", string>>;
};

/** Object names ImageField creates: `<sku-slug>-<timestamp>.<ext>`. */
const STORAGE_IMAGE = /^[a-z0-9-]{1,80}\.(jpe?g|png|webp|avif)$/;
const BUNDLED_IMAGE = /^\/images\/[A-Za-z0-9/_-]{1,200}\.(jpe?g|png|webp|avif)$/;

const lines = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** Everything on the public site that lists products. */
function refreshStorefront() {
  updateTag(PRODUCTS_TAG);
}

async function removeImage(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], image: string | null) {
  if (!isStoragePath(image)) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([image]);
  if (error) console.error("[admin] Could not remove old image:", error.message);
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "") || null;
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "") as CategoryId;
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const image = String(formData.get("image") ?? "").trim() || null;
  const flagship = formData.get("flagship") === "on";
  const published = formData.get("published") === "on";

  // Only photos uploaded to our bucket, or bundled files under /images.
  if (image && !STORAGE_IMAGE.test(image) && !BUNDLED_IMAGE.test(image)) {
    return { error: "That photo isn't valid. Upload it again." };
  }

  const fieldErrors: ProductFormState["fieldErrors"] = {};
  if (!/^[A-Z0-9][A-Z0-9-]{1,39}$/.test(sku)) fieldErrors.sku = "Use letters, numbers and dashes, e.g. MNX-TRC-18.";
  if (!name) fieldErrors.name = "Give the product a name.";
  else if (name.length > 160) fieldErrors.name = "Keep the name under 160 characters.";
  if (!CATEGORY_IDS.includes(category)) fieldErrors.category = "Choose a category.";
  if (description.length > 400) fieldErrors.description = "Keep the summary under 400 characters.";
  if (!Number.isInteger(sortOrder)) fieldErrors.sort_order = "Use a whole number.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const record = {
    sku,
    name,
    category,
    description,
    features: lines(formData.get("features")),
    variants: lines(formData.get("variants")),
    image,
    flagship,
    published,
    sort_order: sortOrder,
  };

  // Only one flagship: clear the current one first.
  if (flagship) {
    let clear = supabase.from("products").update({ flagship: false }).eq("flagship", true);
    if (id) clear = clear.neq("id", id);
    const { error } = await clear;
    if (error) return { error: `Couldn't update the flagship: ${error.message}` };
  }

  let previousImage: string | null = null;
  if (id) {
    const { data: existing } = await supabase.from("products").select("image").eq("id", id).maybeSingle();
    previousImage = existing?.image ?? null;
  }

  const { error } = id
    ? await supabase.from("products").update(record).eq("id", id)
    : await supabase.from("products").insert(record);

  if (error) {
    if (error.code === "23505") return { fieldErrors: { sku: "Another product already uses this code." } };
    return { error: `Couldn't save: ${error.message}` };
  }

  if (previousImage && previousImage !== image) await removeImage(supabase, previousImage);

  refreshStorefront();
  redirect(`/admin?saved=${encodeURIComponent(name)}`);
}

export async function deleteProduct(id: string) {
  const { supabase } = await requireAdmin();

  const { data: existing } = await supabase.from("products").select("image, name").eq("id", id).maybeSingle();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`Couldn't delete: ${error.message}`);

  await removeImage(supabase, existing?.image ?? null);
  refreshStorefront();
  redirect(`/admin?deleted=${encodeURIComponent(existing?.name ?? "Product")}`);
}

export async function setPublished(id: string, published: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").update({ published }).eq("id", id);
  if (error) throw new Error(`Couldn't update: ${error.message}`);
  refreshStorefront();
  revalidatePath("/admin");
}
