"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Film, Play } from "lucide-react";
import ProductMedia from "@/components/catalog/ProductMedia";
import type { Product, ProductMedia as GalleryItem } from "@/types/product";
import { cn } from "@/utils/cn";

type ProductGalleryProps = {
  product: Product;
  sizes: string;
  /** Size and shape of the main viewer. */
  className?: string;
  priority?: boolean;
};

const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/**
 * A product's photos and videos: a main viewer with previous/next, and a
 * thumbnail strip. Without media it shows the category illustration.
 */
export default function ProductGallery({ product, sizes, className, priority }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const items = product.media;
  if (items.length === 0) {
    return <ProductMedia product={product} sizes={sizes} priority={priority} fit="contain" className={className} />;
  }

  const current = items[Math.min(index, items.length - 1)];
  const go = (step: number) => setIndex((i) => (i + step + items.length) % items.length);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className={cn("relative overflow-hidden bg-[#0b0b0c]", className)}>
        <Stage key={itemKey(current)} item={current} product={product} sizes={sizes} priority={priority && index === 0} />

        {items.length > 1 && (
          <>
            <StageButton label="Previous" onClick={() => go(-1)} className="left-3">
              <ChevronLeft className="h-5 w-5" />
            </StageButton>
            <StageButton label="Next" onClick={() => go(1)} className="right-3">
              <ChevronRight className="h-5 w-5" />
            </StageButton>
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] tabular-nums text-white/80 backdrop-blur">
              {index + 1} / {items.length}
            </span>
          </>
        )}
      </div>

      {items.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Photos and videos">
          {items.map((item, i) => (
            <li key={itemKey(item)} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show ${item.type === "image" ? "photo" : "video"} ${i + 1} of ${items.length}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative block h-16 w-16 overflow-hidden rounded-lg border bg-[#0b0b0c] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  i === index ? "border-white" : "border-white/10 hover:border-white/40",
                )}
              >
                <Thumbnail item={item} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const itemKey = (item: GalleryItem) => (item.type === "youtube" ? `yt:${item.id}` : item.src);

function Stage({
  item,
  product,
  sizes,
  priority,
}: {
  item: GalleryItem;
  product: Product;
  sizes: string;
  priority?: boolean;
}) {
  const [playing, setPlaying] = useState(false);

  if (item.type === "image") {
    // Reuses the photo component, so a photo that fails shows the illustration.
    return (
      <ProductMedia
        product={{ ...product, image: item.src, imageAlt: item.alt }}
        sizes={sizes}
        priority={priority}
        fit="contain"
        className="absolute inset-0"
      />
    );
  }

  if (item.type === "video") {
    return (
      <video
        src={item.src}
        controls
        playsInline
        preload="metadata"
        aria-label={`${product.name} video`}
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />
    );
  }

  // YouTube loads only when played, from the privacy-enhanced domain.
  return playing ? (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&rel=0`}
      title={`${product.name} video`}
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 h-full w-full"
    />
  ) : (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${product.name} video`}
      className="group/play absolute inset-0"
    >
      <Image src={youtubeThumbnail(item.id)} alt="" fill unoptimized sizes={sizes} className="object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-black/20">
        <span className="rounded-full bg-black/70 p-4 text-white transition-transform group-hover/play:scale-110">
          <Play className="h-6 w-6 fill-current" />
        </span>
      </span>
    </button>
  );
}

function Thumbnail({ item }: { item: GalleryItem }) {
  if (item.type === "image") {
    return <Image src={item.src} alt="" fill sizes="64px" className="bg-white object-contain" />;
  }
  if (item.type === "youtube") {
    return (
      <>
        <Image src={youtubeThumbnail(item.id)} alt="" fill unoptimized sizes="64px" className="object-cover" />
        <Play className="absolute inset-0 m-auto h-5 w-5 fill-white text-white drop-shadow" />
      </>
    );
  }
  return (
    <span className="flex h-full w-full items-center justify-center text-white/60">
      <Film className="h-5 w-5" />
    </span>
  );
}

function StageButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white/85 backdrop-blur transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}
