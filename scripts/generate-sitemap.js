// Generate public/sitemap.xml from src/data/bosses.json
// Run before build so Vite copies it into dist/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config --------------------------------------------------------------
const SITE = process.env.SITE_ORIGIN || "https://vaultdrops.app"; // change via env if needed

const DATA_FILE = path.join(__dirname, "../src/data/bosses.json");
const PUBLIC_DIR = path.join(__dirname, "../public");
const OUT_FILE = path.join(PUBLIC_DIR, "sitemap.xml");

// --- Helpers -------------------------------------------------------------
const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function url(loc, lastmod, changefreq, priority) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${xmlEscape(changefreq)}</changefreq>` : null,
    priority != null ? `    <priority>${priority}</priority>` : null,
    "  </url>"
  ].filter(Boolean).join("\n");
}

// --- Read data -----------------------------------------------------------
const bosses = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

// Use the bosses.json modification time as a sane lastmod
let lastmod = new Date().toISOString();
try {
  const stat = fs.statSync(DATA_FILE);
  lastmod = new Date(stat.mtime).toISOString();
} catch {}

// --- Build entries -------------------------------------------------------
const entries = [];

// Home
entries.push(url(`${SITE}/`, lastmod, "weekly", 1.0));

// Class Mods
entries.push(url(`${SITE}/classmods`, lastmod, "weekly", 0.8));

// Boss pages
for (const b of bosses) {
  if (!b?.slug) continue;
  entries.push(url(`${SITE}/boss/${encodeURIComponent(b.slug)}`, lastmod, "weekly", 0.7));
}

// --- Write file ----------------------------------------------------------
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const xml = `<?xml version="1.0" encoding="UTF-8"?> 
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

fs.writeFileSync(OUT_FILE, xml.trim() + "\n", "utf8");
console.log(`sitemap.xml: wrote ${entries.length} URLs → ${OUT_FILE}`);
