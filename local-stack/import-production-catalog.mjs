// Copies the REAL catalogue (categories, products with prices and stock,
// variant groups, photo/video links) from the production POS into the LOCAL
// copy, so the local website shows your actual products and photos.
//
// Production is only READ (GET requests). No customers, sales or other
// personal data are copied. You type your production POS login here; it is
// used once for these requests and not saved anywhere.
//
//   node local-stack/import-production-catalog.mjs
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const STACK = dirname(fileURLToPath(import.meta.url));
const PROD_API = process.env.PROD_POS_API_URL ?? "https://api.mynix.lk/api";

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (text) => rl.output.write(text.startsWith(question) ? text : "");
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

async function get(path, token) {
  const res = await fetch(`${PROD_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

const sqlText = (value) => (value == null || value === "" ? "NULL" : `'${String(value).replace(/'/g, "''")}'`);

// Website fields (full name, description, SEO…) exist once production runs POS
// migration V22. Before that, local values are kept.
const WEBSITE_FIELDS = [
  ["fullName", "full_name"],
  ["description", "description"],
  ["seoTitle", "seo_title"],
  ["seoDescription", "seo_description"],
  ["seoKeywords", "seo_keywords"],
  ["imageAlt", "image_alt"],
];
const websiteUpdates = (p) => [
  ...WEBSITE_FIELDS.filter(([key]) => key in p).map(([key, column]) => `${column} = ${key === "fullName" ? `COALESCE(${sqlText(p[key])}, EXCLUDED.name)` : sqlText(p[key])}`),
  ...("showOnWebsite" in p ? [`show_on_website = ${p.showOnWebsite === false ? "false" : "true"}`] : []),
  ...(p.slug ? [`slug = ${sqlText(p.slug)}`] : []),
].map((assignment) => `,\n      ${assignment}`).join("");

// Page address from a name, as POS migration V22 makes it.
const SLUG_SQL = (column) =>
  `COALESCE(NULLIF(LEFT(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(${column}), '[^a-z0-9]+', '-', 'g')), 100), ''), 'product')`;

console.log(`Reading the catalogue from ${PROD_API} (read-only).`);
const username = await ask("Production POS username: ");
const password = await ask("Production POS password: ", { hidden: true });

const login = await fetch(`${PROD_API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});
if (!login.ok) throw new Error(`Login failed (${login.status}). Check the username and password.`);
const { token } = await login.json();

const [categories, products] = await Promise.all([get("/categories", token), get("/products", token)]);
// Variant groups exist once production runs POS migration V23.
const groups = await get("/product-variant-groups", token).catch(() => []);
console.log(`Found ${categories.length} categories, ${products.length} products and ${groups.length} variant groups.`);

// Upsert by name (categories, variant groups) and barcode (products), keeping production's barcodes.
const statements = ["BEGIN;"];
for (const g of groups) {
  statements.push(`INSERT INTO product_variant_groups (name, option_name)
    SELECT ${sqlText(g.name)}, ${sqlText(g.optionName || "Option")}
    WHERE NOT EXISTS (SELECT 1 FROM product_variant_groups WHERE name = ${sqlText(g.name)});`);
}
for (const c of categories) {
  statements.push(`INSERT INTO categories (name, description, active)
    VALUES (${sqlText(c.name)}, ${sqlText(c.description)}, ${c.active === false ? "false" : "true"})
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, active = EXCLUDED.active;`);
}
for (const p of products) {
  const category = categories.find((c) => c.id === p.categoryId)?.name ?? p.category;
  // New rows get a temporary unique address ("tmp-<barcode>"), replaced below.
  statements.push(`INSERT INTO products (name, full_name, slug, barcode, category_id, buying_price, selling_price, stock_quantity, minimum_stock, image_url, active)
    VALUES (${sqlText(p.name)}, ${sqlText(p.fullName || p.name)}, ${sqlText(p.slug || `tmp-${p.barcode}`)}, ${sqlText(p.barcode)},
            (SELECT id FROM categories WHERE name = ${sqlText(category)}),
            ${Number(p.buyingPrice ?? 0)}, ${Number(p.sellingPrice ?? 0)}, ${Number(p.stockQuantity ?? 0)},
            ${Number(p.minimumStock ?? 0)}, ${sqlText(p.imageUrl)}, ${p.active === false ? "false" : "true"})
    ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id,
      buying_price = EXCLUDED.buying_price, selling_price = EXCLUDED.selling_price,
      stock_quantity = EXCLUDED.stock_quantity, minimum_stock = EXCLUDED.minimum_stock,
      image_url = EXCLUDED.image_url, active = EXCLUDED.active${websiteUpdates(p)};`);
}
// Variant group membership and photos/videos (once production sends them).
for (const p of products) {
  const product = `(SELECT id FROM products WHERE barcode = ${sqlText(p.barcode)})`;
  if ("variantGroupId" in p) {
    statements.push(`UPDATE products SET
      variant_group_id = ${p.variantGroupName ? `(SELECT id FROM product_variant_groups WHERE name = ${sqlText(p.variantGroupName)} ORDER BY id LIMIT 1)` : "NULL"},
      variant_label = ${sqlText(p.variantLabel)}
      WHERE barcode = ${sqlText(p.barcode)};`);
  }
  if (Array.isArray(p.media)) {
    // Production uploads stay in production storage; locally they're links to it.
    statements.push(`DELETE FROM product_media WHERE product_id = ${product};`);
    p.media.forEach((m, position) => {
      const youtube = m.type === "YOUTUBE";
      statements.push(`INSERT INTO product_media (product_id, type, url, youtube_id, alt_text, shared, position)
        VALUES (${product}, ${sqlText(m.type)}, ${youtube ? "NULL" : sqlText(m.url)}, ${youtube ? sqlText(m.youtubeId) : "NULL"},
                ${sqlText(m.altText)}, ${m.shared ? "true" : "false"}, ${position});`);
    });
  }
}

// Real page addresses for new rows: from the full name, numbered by id if taken.
statements.push(`WITH base AS (
    SELECT id, active, ${SLUG_SQL("full_name")} AS slug FROM products WHERE slug LIKE 'tmp-%'
  ), numbered AS (
    SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY active DESC, id) AS n FROM base
  )
  UPDATE products p
  SET slug = CASE WHEN numbered.n = 1 AND NOT EXISTS (SELECT 1 FROM products o WHERE o.slug = numbered.slug)
                  THEN numbered.slug ELSE numbered.slug || '-' || numbered.id END
  FROM numbered WHERE numbered.id = p.id;`);
// Hide the local sample products (they can't be deleted if test orders used them).
const prodBarcodes = products.map((p) => sqlText(p.barcode)).join(",") || "''";
statements.push(`UPDATE products SET active = false WHERE barcode NOT IN (${prodBarcodes});`);
// Local-only categories: removed when empty, hidden when old test sales still use their products.
const prodCategories = categories.map((c) => sqlText(c.name)).join(",") || "''";
statements.push(`DELETE FROM categories c WHERE c.name NOT IN (${prodCategories})
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = c.id);`);
statements.push(`UPDATE categories SET active = false WHERE name NOT IN (${prodCategories});`);
statements.push("COMMIT;");

execFileSync("docker", ["compose", "-f", `${STACK}/docker-compose.yml`, "exec", "-T", "db",
  "psql", "-v", "ON_ERROR_STOP=1", "-q", "-U", "mynix", "-d", "mynix_pos"], { input: statements.join("\n"), stdio: ["pipe", "inherit", "inherit"] });

// What the website will be able to show.
const withImage = products.filter((p) => p.imageUrl);
const https = withImage.filter((p) => /^https:\/\//i.test(p.imageUrl.trim()));
console.log(`\nImported into the local POS. ${withImage.length} products have an image link:`);
console.log(`  ${https.length} use https (the website shows these)`);
if (withImage.length > https.length) {
  console.log(`  ${withImage.length - https.length} are not https links and won't show — examples:`);
  for (const p of withImage.filter((x) => !https.includes(x)).slice(0, 5)) console.log(`   · ${p.name}: ${p.imageUrl.slice(0, 80)}`);
}
console.log("\nThe local website picks this up within a minute.");
