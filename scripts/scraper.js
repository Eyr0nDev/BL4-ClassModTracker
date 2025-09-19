(() => {
  // --- helpers --------------------------------------------------------------
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const splitMulti = (el) => {
    // innerText preserves <br> as newlines — perfect for splitting rows
    return el.innerText
      .split('\n')
      .map(norm)
      .filter(Boolean);
  };
  const dedupe = arr => [...new Set(arr)];

  // Try to find tables that look like the big “Boss Name / Legendary …” ones
  const tables = [...document.querySelectorAll('table')].filter(t => {
    const txt = t.innerText.toLowerCase();
    return txt.includes('boss name') && txt.includes('legendary');
  });

  if (!tables.length) {
    console.warn('No “Boss Name / Legendary …” tables found.');
    return;
  }

  // Try to infer a region/section label from the heading just above each table
  const findRegionForTable = (table) => {
    let prev = table;
    for (let i = 0; i < 6; i++) {
      prev = prev.previousElementSibling;
      if (!prev) break;
      const tag = prev.tagName?.toLowerCase();
      if (['h2', 'h3', 'h4'].includes(tag)) return norm(prev.innerText);
    }
    return null;
  };

  const rows = [];

  for (const table of tables) {
    const region = findRegionForTable(table);

    const trs = table.querySelectorAll('tbody tr');
    for (const tr of trs) {
      const tds = tr.querySelectorAll('td');
      if (tds.length < 2) continue; // need at least Boss + Legendary

      const bosses = splitMulti(tds[0]);     // multiple bosses can share a row
      const items  = splitMulti(tds[1]);     // multiple dedicated drops per row
      const prerequisite = tds[2] ? norm(tds[2].innerText) : '';
      const location     = tds[3] ? norm(tds[3].innerText) : '';

      if (!bosses.length || !items.length) continue;

      rows.push({ bosses, items, prerequisite, location, region });
    }
  }

  if (!rows.length) {
    console.warn('Found tables, but no data rows.');
    return;
  }

  // Build a boss → drops mapping (unique, merged across rows/regions)
  const bossMap = {};
  for (const r of rows) {
    for (const b of r.bosses) {
      if (!bossMap[b]) bossMap[b] = [];
      bossMap[b].push(...r.items);
      bossMap[b] = dedupe(bossMap[b]).sort();
    }
  }

  // A slightly richer output you can keep in your repo
  const output = {
    source: location.href,
    scrapedAt: new Date().toISOString(),
    count: {
      rows: rows.length,
      bosses: Object.keys(bossMap).length,
    },
    rows,
    bosses: bossMap
  };

  // Download as JSON
  const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bl4_dedicated_drops.json';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();

  console.log('Scraped rows:', rows.length);
  console.log('Unique bosses:', Object.keys(bossMap).length);
  console.log('Example:', rows[0]);
})();
