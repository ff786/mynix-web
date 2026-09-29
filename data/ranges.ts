/**
 * Website copy for POS categories, matched by name (case and punctuation
 * ignored): a few highlights for the landing-page tiles and the Products menu.
 * The order here is the display order; categories not listed follow A–Z.
 */
export interface CategoryHighlight {
  name: string;
  items: string[];
}

export const CATEGORY_HIGHLIGHTS: CategoryHighlight[] = [
  { name: "Cutting & Polishing Tools", items: ["Gem cutting tools", "Gem polishing tools"] },
  { name: "Scales", items: ["Gem weight scales with multiple scaling values"] },
  { name: "Gem Torches", items: ["Gem identifying torches"] },
  { name: "Gem Inspection", items: ["Gem testing equipment"] },
  { name: "Gem Holding Items", items: ["Gem tweezers with & without lock", "Gem holders", "Shovel trays & scoops"] },
  { name: "Magnifiers", items: ["Head magnifiers / Optivisors", "Magnifying loupes"] },
  { name: "Measuring Tools", items: ["Diamond gauges", "Calipers"] },
  { name: "Boxes & Trays", items: ["Gem display boxes", "Storage boxes & trays"] },
  { name: "Gem Packets & Bags", items: ["Chinese packets", "Japanese packets", "Pouches & more"] },
  { name: "Table Lamps", items: ["Table lamps", "Camera lights"] },
];
