import { PRODUCT_IMAGES_BUCKET, SUPABASE_URL } from "@/lib/supabase/env";

/** Turns a stored image value (Storage path, /public path or URL) into something <Image> can load. */
export function resolveImageUrl(image: string | null | undefined): string | undefined {
  if (!image) return undefined;
  if (image.startsWith("/") || /^https?:\/\//.test(image)) return image;
  return `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${image}`;
}

/** True when the value points at an object in our Storage bucket (safe to delete). */
export const isStoragePath = (image: string | null | undefined): image is string =>
  Boolean(image) && !image!.startsWith("/") && !/^https?:\/\//.test(image!);
