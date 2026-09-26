/** Product ranges showcased on the landing page (the full itemised list lives in the catalog). */
export interface ProductRange {
  id: string;
  title: string;
  items: string[];
}

export const PRODUCT_RANGES: ProductRange[] = [
  { id: "cutting", title: "Cutting & Polishing Tools", items: ["Gem cutting tools", "Gem polishing tools"] },
  { id: "scales", title: "Scales", items: ["Gem weight scales with multiple scaling values"] },
  { id: "torches", title: "Gem Torches", items: ["Gem identifying torches"] },
  { id: "inspection", title: "Gem Inspection", items: ["Gem testing equipment"] },
  {
    id: "holding",
    title: "Gem Holding Items",
    items: ["Gem tweezers with & without lock", "Gem holders", "Shovel trays & scoops"],
  },
  { id: "magnifiers", title: "Magnifiers", items: ["Head magnifiers / Optivisors", "Magnifying loupes"] },
  { id: "measuring", title: "Measuring Tools", items: ["Diamond gauges", "Calipers"] },
  { id: "boxes", title: "Boxes & Trays", items: ["Gem display boxes", "Storage boxes & trays"] },
  {
    id: "packets",
    title: "Gem Packets & Bags",
    items: ["Chinese packets", "Japanese packets", "Pouches & more"],
  },
  { id: "lamps", title: "Table Lamps", items: ["Table lamps", "Camera lights"] },
];
