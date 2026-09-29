import type { Product } from "@/types/product";

/**
 * Automatic variable products: products in the same category at the same
 * price are shown as one listing with an option picker. Groups set in the POS
 * (product.variant) take priority, and a product alone in a POS group is kept
 * separate, which is how staff split a wrong automatic match.
 */
export function withAutoVariants(products: Product[]): Product[] {
  const candidates = new Map<string, Product[]>();
  for (const product of products) {
    if (product.variant) continue;
    const key = `${product.category}:${product.price.toFixed(2)}`;
    const group = candidates.get(key);
    if (group) group.push(product);
    else candidates.set(key, [product]);
  }

  const variants = new Map<string, Product["variant"]>();
  for (const [key, group] of candidates) {
    if (group.length < 2) continue;
    const { name, labels } = describe(group.map((p) => p.name));
    group.forEach((product, i) =>
      variants.set(product.id, { group: `auto-${key}`, groupName: name, optionName: optionName(labels), label: labels[i] }),
    );
  }

  return products.map((product) => {
    const variant = variants.get(product.id);
    return variant ? { ...product, variant } : product;
  });
}

type Token = { text: string; start: number; end: number };

/** Words, hyphens and whole "(…)" parts, with their positions in the name. */
function tokenize(name: string): Token[] {
  return [...name.matchAll(/\([^)]*\)|[^\s\-()]+|-/g)].map((m) => ({
    text: m[0],
    start: m.index!,
    end: m.index! + m[0].length,
  }));
}

const same = (a: Token, b: Token) => a.text.localeCompare(b.text, undefined, { sensitivity: "base" }) === 0;

/** Tokens every name starts with, and tokens every name ends with (without overlapping). */
function commonEnds(names: Token[][]) {
  const shortest = Math.min(...names.map((n) => n.length));
  let prefix = 0;
  while (prefix < shortest && names.every((n) => same(n[prefix], names[0][prefix]))) prefix++;
  let suffix = 0;
  while (
    suffix < shortest - prefix &&
    names.every((n) => same(n[n.length - 1 - suffix], names[0][names[0].length - 1 - suffix]))
  )
    suffix++;
  return { prefix, suffix };
}

/** The original text covered by tokens [from, to). */
const slice = (name: string, tokens: Token[], from: number, to: number) =>
  from < to ? name.slice(tokens[from].start, tokens[to - 1].end) : "";

/** "(Blue)" -> "Blue", "- Black" -> "Black". */
const cleanLabel = (text: string) =>
  text
    .replace(/^[\s\-–—:,/]+|[\s\-–—:,/]+$/g, "")
    .replace(/^\((.*)\)$/, "$1")
    .trim();

/** "Pen Torch -" -> "Pen Torch". */
const cleanName = (text: string) => text.replace(/^[\s\-–—:,/]+|[\s\-–—:,/]+$/g, "").trim();

/**
 * Listing name and one option label per product, from what the names share
 * and where they differ: "Pen Torch (White)" + "Pen Torch (Yellow)" ->
 * "Pen Torch" with "White" / "Yellow". When the names share too little to
 * name the listing, it takes the first name and the options are the full names.
 */
function describe(names: string[]): { name: string; labels: string[] } {
  const described = describeAll(names) ?? describeWithoutBrackets(names);
  if (described) return described;

  // Little in common across all of them: name the listing after the largest set
  // of names that do share a start (six Diamond Laps plus one Diamond Powder ->
  // "Diamond Lap 6''"); the others are listed by their full names.
  const byStart = new Map<string, number[]>();
  names.forEach((name, i) => {
    const start = (tokenize(name)[0]?.text ?? "").toLowerCase();
    byStart.set(start, [...(byStart.get(start) ?? []), i]);
  });
  const largest = [...byStart.values()].sort((a, b) => b.length - a.length)[0];
  const cluster =
    largest.length > names.length / 2 && largest.length < names.length
      ? describeAll(largest.map((i) => names[i]))
      : null;
  if (!cluster) return { name: names[0], labels: names };

  const labels = [...names];
  largest.forEach((index, i) => (labels[index] = cluster.labels[i]));
  return { name: cluster.name, labels };
}

/**
 * Second try with a trailing "(…)" set aside: "10x Magnifying Loupe (Ayaz)"
 * next to "20x Magnifying Loupe" -> "Magnifying Loupe" with "10x (Ayaz)", "20x".
 */
function describeWithoutBrackets(names: string[]): { name: string; labels: string[] } | null {
  const extras = names.map((name) => name.match(/\s*\(([^)]*)\)\s*$/));
  if (!extras.some(Boolean)) return null;
  const described = describeAll(names.map((name, i) => (extras[i] ? name.slice(0, extras[i]!.index) : name)));
  if (!described) return null;

  const labels = described.labels.map((label, i) => {
    const extra = extras[i]?.[1];
    if (!extra) return label;
    return label === "Standard" ? extra : `${label} (${extra})`;
  });
  return new Set(labels).size === labels.length ? { name: described.name, labels } : null;
}

/** Name and labels when all the names share enough, else null. */
function describeAll(names: string[]): { name: string; labels: string[] } | null {
  const tokens = names.map(tokenize);
  const { prefix, suffix } = commonEnds(tokens);
  const first = tokens[0];
  const head = cleanName(slice(names[0], first, 0, prefix));
  const tail = slice(names[0], first, first.length - suffix, first.length);
  const name = cleanName([head, tail].filter(Boolean).join(" "));
  const labels = tokens.map((t, i) => cleanLabel(slice(names[i], t, prefix, t.length - suffix)));

  if (name.length < 4 || labels.filter((l) => !l).length > 1) return null;
  // "10x Magnifying Loupe" next to "10x Magnifying Loupe (Ayaz)": the plain one is the standard option.
  return { name, labels: labels.map((label) => label || "Standard") };
}

const COLOURS =
  /^(black|white|silver|gold|red|blue|green|yellow|pink|purple|orange|brown|grey|gray|clear|transparent|b\/w)$/i;

function optionName(labels: string[]): string {
  if (labels.every((l) => COLOURS.test(l))) return "Colour";
  if (labels.every((l) => /#/.test(l))) return "Grit";
  if (labels.every((l) => /\d/.test(l) && /(cm|mm)\b/i.test(l))) return "Size";
  if (labels.every((l) => /\d/.test(l) && /\b(slots?|grid|lines?)\b/i.test(l))) return "Type";
  return "Option";
}
