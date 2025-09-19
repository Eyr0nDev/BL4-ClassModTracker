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

// Known typos / normalization fixes (bosses)
const FIX_BOSS = {
  "\"Quake Thresher\"": "Quake Thresher",
  "Experiment 1709 (Vile Ted": "Experiment 1709 (Vile Ted)",
};

// Ignore these
const BAD_ITEMS = new Set(["None (bugged?)"]);
const BAD_BOSSES = new Set(["N/A"]);

// Normalize items
function normalizeDrops(arr) {
  return dedupe(
    arr
      .map((x) => FIX_ITEM[x] || x)
      .filter((x) => !BAD_ITEMS.has(x))
      .map((x) => x.trim())
      .filter(Boolean)
  ).sort((a, b) => a.localeCompare(b));
}

// Normalize boss name
function normalizeBossName(name) {
  const trimmed = String(name).trim();
  return FIX_BOSS[trimmed] || trimmed;
}

// Split multiple bosses (handles “A & B”, “A / B”, and comma-separated lists,
// but keeps commas inside parentheses).
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

  return result
    .map((s) => s.replace(/^["“”]|["“”]$/g, "").trim())
    .filter(Boolean)
    .map(normalizeBossName);
}

// --- grouping rules ----------------------------------------------------
// These are the “cards” you want to merge together on Home/boss pages.
const GROUP_DEFS = [
  {
    name: "Foundry Freaks",
    members: ["Frank the Furnace", "Hank the Welder", "Sal the Engineer"],
  },
  {
    name: "Meathead Riders",
    members: ["Saddleback", "Immortal Boneface"],
  },
  {
    name: "Pango & Bango",
    members: ["Pango", "Bango"],
  },
  {
    name: "Rippa Roadbirds",
    members: ["Gruntubulous Vork", "Baby Grunt", "Lil Grunt"],
  },
  {
    name: "Vile Ted & The Experiments",
    members: ["CorrupTed", "Experiment 42", "Experiment 1709 (Vile Ted)", "The Experiments"],
  },
  {
    name: "Voraxis / Quake Thresher",
    members: ["Voraxis", "Quake Thresher"],
  },
];

// --- main ---------------------------------------------------------------
const raw = JSON.parse(fs.readFileSync(inFile, "utf8"));

// Step 1: Build a map of solo bossName -> drops (normalized)
const bossToDrops = new Map();

for (const row of raw.rows ?? []) {
  const bosses = row.bosses?.length ? row.bosses : [];
  const items  = row.items?.length  ? normalizeDrops(row.items) : [];
  if (!bosses.length || !items.length) continue;

  for (const bossBlob of bosses) {
    for (const bossRaw of splitBosses(bossBlob)) {
      if (!bossRaw || BAD_BOSSES.has(bossRaw)) continue;
      const boss = normalizeBossName(bossRaw);
      const curr = bossToDrops.get(boss) || [];
      bossToDrops.set(boss, normalizeDrops(curr.concat(items)));
    }
  }
}

// Step 2: Apply grouping – create grouped entries, remove member entries
const output = [];

// Helper to add a solo entry object
function pushSolo(bossName, drops) {
  output.push({
    slug: slugify(bossName),
    name: bossName,
    drops: normalizeDrops(drops || []),
  });
}

// Apply each group definition
for (const def of GROUP_DEFS) {
  // Collect members that actually exist in the map
  const presentMembers = def.members.filter((m) => bossToDrops.has(m));
  if (presentMembers.length === 0) continue; // nothing to group

  // Union all drops from members
  let unionDrops = [];
  for (const m of presentMembers) {
    unionDrops = unionDrops.concat(bossToDrops.get(m) || []);
  }
  unionDrops = normalizeDrops(unionDrops);

  // Remove members from the solo map so they don't appear twice
  for (const m of presentMembers) {
    bossToDrops.delete(m);
  }

  // Push the grouped entry
  output.push({
    slug: slugify(def.name),
    name: def.name,
    bosses: presentMembers, // list the members present in data
    drops: unionDrops,
  });
}

// Step 3: Add remaining solo bosses that were not grouped
for (const [name, drops] of bossToDrops.entries()) {
  pushSolo(name, drops);
}

// Step 4: Sort by display name
output.sort((a, b) => a.name.localeCompare(b.name));

// Step 5: Write file
fs.writeFileSync(outFile, JSON.stringify(output, null, 2), "utf8");
console.log(`Wrote ${output.length} bosses → ${outFile}`);
