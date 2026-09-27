// Copies the REAL catalogue (categories + products, with prices, stock and
// image links) from the production POS into the LOCAL copy, so the local
// website shows your actual products and photos.
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
console.log(`Found ${categories.length} categories and ${products.length} products.`);

// Upsert by name (categories) and barcode (products), keeping production's barcodes.
const statements = ["BEGIN;"];
for (const c of categories) {
  statements.push(`INSERT INTO categories (name, description, active)
    VALUES (${sqlText(c.name)}, ${sqlText(c.description)}, ${c.active === false ? "false" : "true"})
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, active = EXCLUDED.active;`);
}
for (const p of products) {
  const category = categories.find((c) => c.id === p.categoryId)?.name ?? p.category;
  statements.push(`INSERT INTO products (name, barcode, category_id, buying_price, selling_price, stock_quantity, minimum_stock, image_url, active)
    VALUES (${sqlText(p.name)}, ${sqlText(p.barcode)}, (SELECT id FROM categories WHERE name = ${sqlText(category)}),
            ${Number(p.buyingPrice ?? 0)}, ${Number(p.sellingPrice ?? 0)}, ${Number(p.stockQuantity ?? 0)},
            ${Number(p.minimumStock ?? 0)}, ${sqlText(p.imageUrl)}, ${p.active === false ? "false" : "true"})
    ON CONFLICT (barcode) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id,
      buying_price = EXCLUDED.buying_price, selling_price = EXCLUDED.selling_price,
      stock_quantity = EXCLUDED.stock_quantity, minimum_stock = EXCLUDED.minimum_stock,
      image_url = EXCLUDED.image_url, active = EXCLUDED.active;`);
}
// Hide the local sample products (they can't be deleted if test orders used them).
const prodBarcodes = products.map((p) => sqlText(p.barcode)).join(",") || "''";
statements.push(`UPDATE products SET active = false WHERE barcode NOT IN (${prodBarcodes});`);
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
