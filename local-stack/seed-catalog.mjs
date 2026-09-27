// Adds sample categories and products to the LOCAL POS through its admin API —
// the same way staff add them in the POS. Uses the website's product names with
// made-up prices and stock. Local testing only.
import { readFileSync } from "node:fs";

const [apiUrl, adminUser, adminPassword] = process.argv.slice(2);
if (!apiUrl?.startsWith("http://localhost")) throw new Error("Refusing to seed anything but a localhost POS.");

const CATEGORY_NAMES = {
  torches: "Inspection Lights",
  optical: "Optical & Loupes",
  scales: "Scales & Gauges",
  lapidary: "Lapidary",
  accessories: "Accessories & Boxes",
};

const source = readFileSync(new URL("../data/products.ts", import.meta.url), "utf8");
const products = [...source.matchAll(/name:\s*"([^"]+)",\s*category:\s*"([a-z]+)"/g)].map(([, name, category]) => ({
  name,
  category,
}));

async function call(path, method, body, token) {
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const { token } = await call("/auth/login", "POST", { username: adminUser, password: adminPassword });

const existing = await call("/products", "GET", undefined, token);
if (existing.length > 0) {
  console.log(`Catalogue already has ${existing.length} products — skipping.`);
  process.exit(0);
}

const categoryIds = {};
for (const [id, name] of Object.entries(CATEGORY_NAMES)) {
  categoryIds[id] = (await call("/categories", "POST", { name, description: `${name} (sample)` }, token)).id;
}

let n = 0;
for (const product of products) {
  n += 1;
  const price = 1500 + ((n * 7919) % 40) * 250; // LKR 1,500 – 11,250
  await call(
    "/products",
    "POST",
    {
      name: product.name,
      categoryId: categoryIds[product.category],
      buyingPrice: Math.round(price * 0.6),
      sellingPrice: price,
      stockQuantity: n % 9 === 0 ? 0 : (n % 7) + 1, // a few out of stock
      minimumStock: 1,
    },
    token,
  );
}
console.log(`Added ${Object.keys(categoryIds).length} categories and ${products.length} sample products.`);
