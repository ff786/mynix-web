"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { resolveImageUrl } from "@/lib/images";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/env";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/**
 * Uploads straight from the browser to Supabase Storage (no server size limits),
 * then stores the object path in a hidden `image` input for the form to save.
 */
export default function ImageField({ defaultValue, sku }: { defaultValue: string | null; sku: string }) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = resolveImageUrl(value);

  async function upload(file: File) {
    setError(null);
    if (!ACCEPT.split(",").includes(file.type)) return setError("Use a JPG, PNG, WebP or AVIF image.");
    if (file.size > MAX_BYTES) return setError("Images must be under 8 MB.");

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const slug = (sku || "product").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error: uploadError } = await createSupabaseBrowserClient()
      .storage.from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, { cacheControl: "31536000", contentType: file.type });
    setUploading(false);

    if (uploadError) return setError(`Upload failed: ${uploadError.message}`);
    setValue(path);
  }

  return (
    <div className="space-y-2">
      <span id={inputId} className="sr-only">
        Photo
      </span>
      <input type="hidden" name="image" value={value} />

      <div className="flex items-start gap-5">
        <div className="relative aspect-[4/3] w-48 shrink-0 overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {preview ? (
            <Image src={preview} alt="Product photo preview" fill sizes="192px" className="object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink/30">
              <ImagePlus className="h-8 w-8" strokeWidth={1.25} />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-ink/60" />
            </div>
          )}
        </div>

        <div className="space-y-3 pt-1">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            aria-labelledby={inputId}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-ink/40 disabled:opacity-50"
          >
            {value ? "Replace photo" : "Upload photo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="flex items-center gap-1.5 text-sm text-ink/60 transition-colors hover:text-red-700"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          )}
          <p className="max-w-56 text-[13px] leading-relaxed text-ink/50">
            JPG, PNG, WebP or AVIF, up to 8 MB. A plain or transparent background looks best.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
