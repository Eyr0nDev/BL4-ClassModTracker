// src/pages/ClassMods.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Header from "../components/Header";
import usePageMeta from "../hooks/usePageMeta";

import { supabase } from "../lib/supabase";
import { getClientId } from "../lib/clientId";
import { wilsonCI } from "../lib/stats";

import VexIcon from "../assets/Vex.png";
import RafaIcon from "../assets/Rafa.png";
import AmonIcon from "../assets/Amon.png";
import HarloweIcon from "../assets/Harlowe.png";

const STORAGE_KEY = "bl4-loot-tracker-classmods-v13"; // bump for new fields

const COLUMNS = ["Vex", "Rafa", "Amon", "Harlowe"];
const ROWS = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const VH_ICONS = { Vex: VexIcon, Rafa: RafaIcon, Amon: AmonIcon, Harlowe: HarloweIcon };

// 4x4 zero matrix helper
const zeroMatrix = () => Array.from({ length: 4 }, () => Array(4).fill(0));

const rarityStyles = {
  Common:    { text: "text-slate-200",   chip: "bg-slate-600/30 border-slate-500/40",   dot: "bg-slate-300" },
  Uncommon:  { text: "text-green-400",   chip: "bg-green-500/10 border-green-500/30",  dot: "bg-green-400" },
  Rare:      { text: "text-blue-400",    chip: "bg-blue-500/10 border-blue-500/30",   dot: "bg-blue-400" },
  Epic:      { text: "text-violet-400",  chip: "bg-violet-500/10 border-violet-500/30",dot: "bg-violet-400" },
  Legendary: { text: "text-orange-400",  chip: "bg-orange-500/10 border-orange-500/30",dot: "bg-orange-400" },
};

const defaultState = {
  cols: COLUMNS,
  rows: ROWS,
  counts: {},           // existing rarity counters per cell
  activeCol: null,      // persisted "VH played" (index into COLUMNS)
  matrix: zeroMatrix(), // 4x4 source (played) → target (dropped) counts
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      cols: COLUMNS,
      rows: ROWS,
      counts: parsed?.counts ?? {},
      activeCol: Number.isInteger(parsed?.activeCol) ? parsed.activeCol : null,
      matrix: Array.isArray(parsed?.matrix) && parsed.matrix.length === 4
        ? parsed.matrix.map(row => (Array.isArray(row) && row.length === 4 ? row : Array(4).fill(0)))
        : zeroMatrix(),
    };
  } catch {
    return defaultState;
  }
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export default function ClassMods() {
  usePageMeta({
    title: "VaultDrops — Class Mods Tracker",
    description:
      "Track Class Mod drops by Vault Hunter with rarity breakdowns. Simple counters, clean stats, and local save — perfect for Borderlands 4 farming.",
    canonicalPath: "/classmods",
  });

  const [state, setState] = useState(() => loadState());
  useEffect(() => saveState(state), [state]);

  // convenience
  const activeCol = state.activeCol;

  const keyOf = (r, c) => `${r}-${c}`;
  const setActiveCol = (idx) =>
    setState((p) => ({ ...p, activeCol: p.activeCol === idx ? null : idx }));

  // increment/decrement a rarity cell, and (if activeCol is set) update the source→target matrix
  const inc = (r, c, d = 1) =>
    setState((p) => {
      // update rarity counters
      const next = Math.max(0, (p.counts[keyOf(r, c)] || 0) + d);
      const counts = { ...p.counts, [keyOf(r, c)]: next };

      // update matrix if we know who was played (source); only if d !== 0
      let matrix = p.matrix;
      if (Number.isInteger(p.activeCol) && d !== 0) {
        const src = p.activeCol; // who you were playing
        const tgt = c;           // which VH the mod belongs to (column)
        const clone = p.matrix.map((row) => row.slice());
        clone[src][tgt] = Math.max(0, (clone[src][tgt] || 0) + d);
        matrix = clone;
      }
      return { ...p, counts, matrix };
    });

  // --- Long-press handlers (mobile-friendly decrement) ---
  function pressHandlers(ri, ci) {
    let timer = null;
    let longPressed = false;
    const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };

    return {
      onPointerDown: () => {
        longPressed = false;
        timer = setTimeout(() => { longPressed = true; inc(ri, ci, -1); }, 350);
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onContextMenu: (e) => e.preventDefault(),
      onClick: (e) => { if (!longPressed) inc(ri, ci, e.shiftKey ? -1 : 1); },
    };
  }

  // totals for existing table UI
  const colTotals = useMemo(
    () => state.cols.map((_, ci) => state.rows.reduce((s, _, ri) => s + (state.counts[keyOf(ri, ci)] || 0), 0)),
    [state]
  );
  const grandTotal = useMemo(() => colTotals.reduce((a, b) => a + b, 0), [colTotals]);

  const rarityMix = (ci) => {
    const total = colTotals[ci] || 0;
    return ROWS.map((r, ri) => {
      const n = state.counts[keyOf(ri, ci)] || 0;
      const pct = total ? Math.round((n / total) * 1000) / 10 : 0;
      return { label: r, n, pct, style: rarityStyles[r] };
    });
  };

  // ====================== Publish to Supabase (anonymous) ======================
  const [pubState, setPubState] = useState({ loading: false, ok: false, err: "" });

  const publish = useCallback(async () => {
    const client_hash = getClientId();

    // Defensive copy & validate 4x4
    const m = Array.isArray(state.matrix) && state.matrix.length === 4
      ? state.matrix.map((row) => (Array.isArray(row) && row.length === 4 ? row.map((x) => Math.max(0, x|0)) : Array(4).fill(0)))
      : zeroMatrix();

    // If matrix is entirely zeros, nothing to publish
    const hasData = m.some(row => row.some(x => x > 0));
    if (!hasData) {
      setPubState({ loading: false, ok: false, err: "Nothing to publish yet." });
      return;
    }

    setPubState({ loading: true, ok: false, err: "" });
    const payload = {
      client_hash,
      matrix_json: m,
      submitted_at: new Date().toISOString(),
      app_ver: "web-1",
    };

    const { error } = await supabase
      .from("classmods_submissions")
      .upsert(payload, { onConflict: "client_hash" });

    if (error) {
      setPubState({ loading: false, ok: false, err: error.message || "Publish failed." });
    } else {
      setPubState({ loading: false, ok: true, err: "" });
      fetchCommunity(); // refresh after publish
    }
  }, [state.matrix]);

  // ====================== Community aggregation ===============================
  const [community, setCommunity] = useState({
    loading: true,
    err: "",
    submissions: 0,
    matrix: zeroMatrix(),  // summed community matrix
    rowTotals: [0, 0, 0, 0],
  });

  const fetchCommunity = useCallback(async () => {
    setCommunity((p) => ({ ...p, loading: true, err: "" }));
    const { data, error } = await supabase
      .from("classmods_submissions")
      .select("matrix_json");

    if (error) {
      setCommunity((p) => ({ ...p, loading: false, err: error.message || "Failed to load community data." }));
      return;
    }

    // Sum all matrices
    const sum = zeroMatrix();
    let submissions = 0;

    for (const row of data) {
      const m = row.matrix_json;
      if (!Array.isArray(m) || m.length !== 4) continue;
      submissions++;
      for (let i = 0; i < 4; i++) {
        if (!Array.isArray(m[i]) || m[i].length !== 4) continue;
        for (let j = 0; j < 4; j++) {
          const v = Number(m[i][j]) || 0;
          sum[i][j] += v;
        }
      }
    }

    const rowTotals = sum.map((r) => r.reduce((a, b) => a + b, 0));
    setCommunity({ loading: false, err: "", submissions, matrix: sum, rowTotals });
  }, []);

  useEffect(() => { fetchCommunity(); }, [fetchCommunity]);

  // format % with Wilson CI tooltip for a cell (source i → target j)
  const cellDisplay = (i, j) => {
    const n = community.rowTotals[i] || 0;
    const x = (community.matrix[i]?.[j] || 0);
    const { p, moe } = wilsonCI(x, n); // p in [0..1]
    return {
      pctText: `${(p * 100).toFixed(1)}%`,
      title: n > 0 ? `${COLUMNS[i]} → ${COLUMNS[j]}: ${(p * 100).toFixed(1)}% ±${moe.toFixed(1)} (n=${n}, x=${x})` : "No data yet",
    };
  };

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 flex items-start justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-5xl">
        <Header
          backTo="/"
          title="Class Mods Tracker"
          onReset={() => { if (confirm("Reset all counters?")) setState(defaultState); }}
          rightSlot={
            <button
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow border border-emerald-400/30 text-sm disabled:opacity-60"
              onClick={publish}
              disabled={pubState.loading}
              title="Publish your current matrix to VaultDrops (anonymous). Re-publishing updates your previous submission."
            >
              {pubState.loading ? "Publishing…" : pubState.ok ? "Published ✓" : "Publish"}
            </button>
          }
        />

        {/* === VH selector (persists) === */}
        <div className="mb-4 flex justify-center">
          <div className="w-full max-w-[520px] bg-slate-900/60 border border-slate-700/60 rounded-xl shadow px-3 sm:px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-slate-400 text-xs sm:text-sm">VH played:</span>
              <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-3">
                {state.cols.map((name, idx) => (
                  <button
                    key={name}
                    onClick={() => setActiveCol(idx)}
                    className={`h-9 w-full rounded-full border text-xs sm:text-sm transition ${
                      activeCol === idx
                        ? "bg-amber-500/20 border-amber-400/60 text-amber-300 ring-2 ring-amber-400/40"
                        : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-200"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            {!Number.isInteger(activeCol) && (
              <p className="mt-2 text-[11px] text-amber-300/90">
                Tip: select who you’re playing so community stats can attribute drops correctly.
              </p>
            )}
          </div>
        </div>

        {/* === Card / Table === */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0f0f11] shadow-2xl overflow-visible">
          <div className="relative overflow-x-hidden">
            <table className="w-full text-sm">
              <colgroup>
                <col />
                {state.cols.map((_, i) => (
                  <col key={i} className="w-[4.25rem] sm:w-[5.25rem] md:w-[5.75rem]" />
                ))}
              </colgroup>

              <thead className="bg-black/30 backdrop-blur">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-slate-400">
                    <span className="hidden sm:inline">Rarity / Vault Hunter</span>
                    <span className="sm:hidden">Rarity</span>
                  </th>
                  {state.cols.map((c, ci) => (
                    <th key={ci} className={`px-1.5 sm:px-3 py-1.5 text-center ${activeCol===ci ? "bg-amber-500/5":""}`}>
                      <div className="flex flex-col items-center justify-center gap-1">
                        <img
                          src={VH_ICONS[c]}
                          alt={c}
                          className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border border-slate-700/60"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                        <span className={`hidden sm:block text-base font-semibold ${activeCol===ci ? "text-amber-300":""}`}>{c}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {state.rows.map((r, ri) => {
                  const style = rarityStyles[r];
                  return (
                    <tr key={ri} className="border-t border-slate-800/80 hover:bg-white/5 transition-colors">
                      <td className="px-3 sm:px-4 py-2 align-middle">
                        <div className={`inline-flex items-center gap-2 px-1.5 sm:px-3 py-1 rounded-full ${"sm:border " + style.chip}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                          <span className={`font-medium ${style.text} text-xs sm:text-sm hidden sm:inline`}>{r}</span>
                        </div>
                      </td>

                      {state.cols.map((_, ci) => {
                        const v = state.counts[keyOf(ri, ci)] || 0;
                        const active = activeCol === ci;
                        const handlers = pressHandlers(ri, ci);
                        return (
                          <td key={ci} className={`px-1 sm:px-2 md:px-3 py-2 text-center ${active ? "bg-amber-500/5":""}`}>
                            <button
                              className={`w-full h-9 sm:h-11 rounded-xl border grid place-items-center select-none transition ${
                                active
                                  ? "border-amber-400/70 ring-2 ring-amber-400/40 bg-slate-900/70"
                                  : "border-slate-700/60 bg-slate-900/60 hover:bg-slate-900 focus:ring-2 focus:ring-amber-500/40"
                              }`}
                              title="Click: +1 • Shift+Click: −1 • Long-press: −1"
                              {...handlers}
                            >
                              <span className="text-sm sm:text-lg font-semibold tabular-nums">{v}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="border-t border-slate-800/80">
                <tr>
                  <td className="px-3 sm:px-4 py-3 text-slate-400 text-xs sm:text-sm">Loot share per VH</td>
                  {state.cols.map((_, ci) => {
                    const total = colTotals[ci];
                    const pctNum = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
                    const pct = Math.round(pctNum * 10) / 10;
                    const active = activeCol === ci;
                    const mix = (function getMix() {
                      const t = colTotals[ci] || 0;
                      return ROWS.map((r, ri) => {
                        const n = state.counts[keyOf(ri, ci)] || 0;
                        const p = t ? Math.round((n / t) * 1000) / 10 : 0;
                        return { label: r, n, pct: p, style: rarityStyles[r] };
                      });
                    })();

                    return (
                      <td key={ci} className={`px-1.5 sm:px-3 py-3 text-center ${active ? "bg-amber-500/5":""}`}>
                        <div className="relative flex flex-col items-center gap-1">
                          <span className={`text-sm sm:text-base font-bold tabular-nums ${active ? "text-amber-300":""}`}>
                            <span className="relative group inline-block">
                              {pct.toFixed(1)}%
                              <div
                                role="tooltip"
                                className="pointer-events-none fixed z-50 opacity-0 group-hover:opacity-100 transition
                                           bg-black/95 text-white text-[11px] sm:text-xs rounded-md shadow-lg
                                           border border-slate-700 px-2 py-1.5
                                           left-1/2 -translate-x-1/2 mt-2"
                                style={{ top: "calc(var(--mouse-y, 0px) + 16px)" }}
                              >
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-left">
                                  {mix.map(({label, n, pct, style}) => (
                                    <React.Fragment key={label}>
                                      <span className={`flex items-center gap-1 ${style.text}`}>
                                        <span className={`inline-block w-2 h-2 rounded-full ${style.dot}`} />
                                        {label}
                                      </span>
                                      <span className="tabular-nums text-right">
                                        {pct.toFixed(1)}% <span className="text-slate-400">({n})</span>
                                      </span>
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            </span>
                          </span>

                          <span className="text-[10px] sm:text-[11px] text-slate-400">Total: {total}</span>

                          <div className="hidden sm:block mt-1 w-full">
                            <div className="h-2 w-24 sm:w-28 md:w-32 lg:w-36 mx-auto bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                              <div style={{ width: `${pctNum}%` }} className={`h-full ${active ? "bg-amber-300":"bg-amber-500"} rounded-full`} />
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-slate-400 border-t border-slate-800/80 bg-black/20 text-center">
            Total drops logged: <span className="font-semibold text-slate-200">{grandTotal}</span>
          </div>
          <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-slate-500 border-t border-slate-800/80 bg-black/20">
            Data saved locally.
          </div>

          {/* ============ Community rates ============ */}
          <CommunityMatrix community={community} />
        </div>

        {pubState.err && (
          <p className="mt-3 text-sm text-red-400">Publish error: {pubState.err}</p>
        )}
      </div>
    </main>
  );
}

function CommunityMatrix({ community }) {
  if (community.loading) {
    return (
      <div className="px-3 sm:px-4 py-3 border-t border-slate-800/80 bg-black/20 text-slate-400 text-sm">
        Loading community rates…
      </div>
    );
  }
  if (community.err) {
    return (
      <div className="px-3 sm:px-4 py-3 border-t border-slate-800/80 bg-black/20 text-red-400 text-sm">
        {community.err}
      </div>
    );
  }

  const { submissions, matrix, rowTotals } = community;
  const line = (i) => {
    // Build "Vex: x% Vex, x% Rafa, ..."
    const parts = COLUMNS.map((col, j) => {
      const n = rowTotals[i] || 0;
      const x = (matrix[i]?.[j] || 0);
      const { p, moe } = wilsonCI(x, n);
      const pctStr = `${(p * 100).toFixed(1)}%`;
      const title = n > 0
        ? `${COLUMNS[i]} → ${col}: ${pctStr} ±${moe.toFixed(1)} (n=${n}, x=${x})`
        : "No data yet";
      return (
        <span key={j} title={title} className="whitespace-nowrap">
          {col}: {pctStr}
        </span>
      );
    });

    return (
      <div key={i} className="text-[13px] text-slate-300 flex flex-wrap gap-x-3 gap-y-1">
        <span className="font-semibold w-16">{COLUMNS[i]}:</span>
        {parts.reduce((acc, el, idx) => {
          if (idx > 0) acc.push(<span key={`sep-${idx}`} className="text-slate-500">,</span>);
          acc.push(el);
          return acc;
        }, [])}
      </div>
    );
  };

  return (
    <div className="px-3 sm:px-4 py-3 border-t border-slate-800/80 bg-black/20">
      <div className="flex items-center justify-between">
        <div className="text-slate-300 font-semibold">Community rates</div>
        <div className="text-[11px] text-slate-400">{submissions} submissions</div>
      </div>
      <div className="mt-2 grid gap-1.5">
        {[0,1,2,3].map((i) => line(i))}
      </div>
    </div>
  );
}
