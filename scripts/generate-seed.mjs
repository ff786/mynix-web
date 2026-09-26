// Regenerates supabase/seed.sql from data/products.ts (the original bundled list).
// Usage: node --experimental-strip-types scripts/generate-seed.mjs
import { writeFileSync } from "node:fs";
import { PRODUCTS } from "../data/products.ts";

const text = (v) => (v == null ? "null" : `'${String(v).replaceAll("'", "''")}'`);
const array = (items = []) => `array[${items.map(text).join(", ")}]::text[]`;

const rows = PRODUCTS.map(
  (p, i) =>
    `  (${[text(p.sku), text(p.name), text(p.category), text(p.description), array(p.features), array(p.variants), text(p.image), p.flagship ? "true" : "false", "true", (i + 1) * 10].join(", ")})`,
);

const sql = `-- MYNIX — initial product list (generated from data/products.ts).
-- Run after schema.sql in Supabase → SQL Editor. Existing SKUs are left untouched.

insert into public.products (sku, name, category, description, features, variants, image, flagship, published, sort_order)
values
${rows.join(",\n")}
on conflict (sku) do nothing;
`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`Wrote ${rows.length} products to supabase/seed.sql`);
