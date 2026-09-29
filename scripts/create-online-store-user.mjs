// Creates (or resets) the POS account the website signs in with: username
// "online-store", role ONLINE_STORE, a long random password. You sign in with
// your own admin account; your password is only sent to the POS, never stored.
//
//   node scripts/create-online-store-user.mjs
//
// Then put the printed username and password in the website's Vercel project
// (POS_STORE_USERNAME / POS_STORE_PASSWORD, Production) and redeploy.
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";

const API = process.env.POS_API_URL ?? "https://api.mynix.lk/api";
const STORE_USERNAME = "online-store";

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (text) => rl.output.write(text.startsWith(question) ? text : "");
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

async function call(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data?.message ?? text}`);
  return data;
}

console.log(`POS: ${API}`);
const username = await ask("Your POS admin username: ");
const password = await ask("Your POS admin password: ", { hidden: true });
const { token, role, mustChangePassword } = await call("POST", "/auth/login", null, { username, password });
if (role !== "ADMIN") throw new Error("Please sign in with an admin account.");
if (mustChangePassword) throw new Error("Choose your new admin password in the POS first, then run this again.");

// Letters and numbers only, so it pastes cleanly into Vercel.
const storePassword = randomBytes(24).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 32);
const user = { fullName: "Website (online store)", username: STORE_USERNAME, password: storePassword, role: "ONLINE_STORE" };

const existing = (await call("GET", "/users", token)).find((u) => u.username === STORE_USERNAME);
if (existing) {
  await call("PUT", `/users/${existing.id}`, token, { ...user, active: true });
  console.log(`\nReset the existing "${STORE_USERNAME}" user (role Online Store, new password).`);
} else {
  await call("POST", "/users", token, user);
  console.log(`\nCreated the "${STORE_USERNAME}" user (role Online Store).`);
}

// Check the website's sign-in works and can read the catalogue.
const store = await call("POST", "/auth/login", null, { username: STORE_USERNAME, password: storePassword });
const products = await call("GET", "/store/products", store.token);
console.log(`Checked: it signs in and sees ${products.length} products for the website.\n`);
console.log("Put these in Vercel → mynix-web → Settings → Environment Variables (Production):");
console.log(`  POS_API_URL=${API}`);
console.log(`  POS_STORE_USERNAME=${STORE_USERNAME}`);
console.log(`  POS_STORE_PASSWORD=${storePassword}`);
console.log("\nThis password is shown only now; nothing is saved.");
