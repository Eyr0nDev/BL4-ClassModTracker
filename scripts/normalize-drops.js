// Run with: node scripts/normalize-drops.js

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const inFile  = path.join(__dirname, "../src/data/raw_dedicated_drops.json");
const outFile = path.join(__dirname, "../src/data/bosses.json");

// --- helpers -----------------------------------------------------------
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/["“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const dedupe = (arr) => [...new Set(arr)];

// Split multiple bosses (handles “A & B”, “A / B”, and comma-separated lists).
function splitBosses(raw) {
  const firstPass = String(raw).split(/\s+\/\s+|\s*&\s*/g);

  const result = [];
  for (const part of firstPass) {
    let depth = 0;
    let start = 0;
    for (let i = 0; i < part.length; i++) {
      const ch = part[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth = Math.max(0, depth - 1);
      else if (ch === "," && depth === 0) {
        result.push(part.slice(start, i));
        start = i + 1;
      }
    }
    result.push(part.slice(start));
  }

  return result.map(s => s.replace(/^["“”]|["“”]$/g, "").trim()).filter(Boolean);
}

// Fix known typos
const FIX_ITEM = {
  "Firewerks": "Fireworks",
  "Potato Thower IV": "Potato Thrower IV"
};

// Ignore these
const BAD_ITEMS = new Set(["None (bugged?)"]);
const BAD_BOSSES = new Set(["N/A"]);

function normalizeDrops(arr) {
  return dedupe(
    arr
      .map(x => FIX_ITEM[x] || x)
      .filter(x => !BAD_ITEMS.has(x))
      .map(x => x.trim())
      .filter(Boolean)
  ).sort((a, b) => a.localeCompare(b));
}

// --- main ---------------------------------------------------------------
const raw = JSON.parse(fs.readFileSync(inFile, "utf8"));

const bossToDrops = new Map();

for (const row of raw.rows) {
  const bosses = row.bosses?.length ? row.bosses : [];
  const items  = row.items?.length  ? normalizeDrops(row.items) : [];
  if (!bosses.length || !items.length) continue;

  for (const bossBlob of bosses) {
    for (const boss of splitBosses(bossBlob)) {
      if (!boss || BAD_BOSSES.has(boss)) continue;
      const curr = bossToDrops.get(boss) || [];
      bossToDrops.set(boss, normalizeDrops(curr.concat(items)));
    }
  }
}

const out = [...bossToDrops.entries()].map(([name, drops]) => ({
  slug: slugify(name),
  name,
  drops
})).sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(outFile, JSON.stringify(out, null, 2), "utf8");
console.log(`Wrote ${out.length} bosses → ${outFile}`);
