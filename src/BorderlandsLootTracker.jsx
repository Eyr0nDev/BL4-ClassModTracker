/*
Borderlands 4 — Class Mod Loot Tracker (v12.3 – colgroup-driven layout, no TS in JSX)
- GH Pages–friendly (images imported from src/assets)
- Column widths via <colgroup> for perfect centering
*/

import React, { useEffect, useMemo, useState } from "react";

import logoSrc from "./assets/borderlands4-logo.png";
import VexIcon from "./assets/Vex.png";
import RafaIcon from "./assets/Rafa.png";
import AmonIcon from "./assets/Amon.png";
import HarloweIcon from "./assets/Harlowe.png";

const STORAGE_KEY = "bl4-loot-tracker-classmods-v12";

const COLUMNS = ["Vex", "Rafa", "Amon", "Harlowe"];
const ROWS = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

const VH_ICONS = {
  Vex: VexIcon,
  Rafa: RafaIcon,
  Amon: AmonIcon,
  Harlowe: HarloweIcon,
};

const rarityStyles = {
  Common: { text: "text-slate-200", chip: "bg-slate-600/30 border-slate-500/40", dot: "bg-slate-300" },
  Uncommon: { text: "text-green-400", chip: "bg-green-500/10 border-green-500/30", dot: "bg-green-400" },
  Rare: { text: "text-blue-400", chip: "bg-blue-500/10 border-blue-500/30", dot: "bg-blue-400" },
  Epic: { text: "text-violet-400", chip: "bg-violet-500/10 border-violet-500/30", dot: "bg-violet-400" },
  Legendary: { text: "text-orange-400", chip: "bg-orange-500/10 border-orange-500/30", dot: "bg-orange-400" },
};

const defaultState = { cols: COLUMNS, rows: ROWS, counts: {} };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { cols: COLUMNS, rows: ROWS, counts: parsed?.counts ?? {} };
  } catch {
    return defaultState;
  }
}
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export default function BorderlandsLootTracker() {
  const [state, setState] = useState(() => loadState());
  const [activeCol, setActiveCol] = useState(null);
  useEffect(() => saveState(state), [state]);

  const keyOf = (r, c) => `${r}-${c}`;
  const inc = (r, c, d = 1) =>
    setState((p) => ({
      ...p,
      counts: {
        ...p.counts,
        [keyOf(r, c)]: Math.max(0, (p.counts[keyOf(r, c)] || 0) + d),
      },
    }));

  const colTotals = useMemo(
    () =>
      state.cols.map((_, ci) =>
        state.rows.reduce((s, _, ri) => s + (state.counts[keyOf(ri, ci)] || 0), 0)
      ),
    [state]
  );
  const grandTotal = useMemo(() => colTotals.reduce((a, b) => a + b, 0), [colTotals]);

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 flex items-start justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-5xl">
        {/* === HEADER === */}
        <header className="rounded-xl bg-slate-900/60 border border-slate-700/60 shadow px-3 sm:px-4 py-2 mb-4 sm:mb-6">
          {/* Mobile header */}
          <div className="sm:hidden grid grid-cols-[1fr_auto_1fr] items-center">
            <div />
            <h1 className="text-center text-base font-extrabold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-amber-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                BL4 —
              </span>{" "}
              <span className="text-slate-200">Class Mods Tracker</span>
            </h1>
            <div className="flex justify-end">
              <button
                aria-label="Reset"
                className="p-2 rounded-lg bg-red-600 hover:bg-red-500 border border-red-400/30 shadow text-white"
                onClick={() => {
                  if (confirm("Reset all counters?")) setState(defaultState);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 2.64-6.36" />
                  <path d="M3 3v6h6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-[auto,1fr,auto] items-center gap-3">
            <img
              src={logoSrc}
              alt="BL4"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <h1 className="justify-self-center flex items-center gap-2 text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-amber-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Borderlands 4 —
              </span>
              <span className="text-slate-200">Class Mod Loot Tracker</span>
              <span
                className="relative group inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-300 cursor-default hover:bg-slate-500/30"
                aria-label="How to use"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none" />
                </svg>
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition bg-black text-white text-[11px] px-2 py-1 rounded absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap shadow-lg border border-slate-700">
                  Click: +1 • Shift+Click: −1
                </span>
              </span>
            </h1>
            <button
              className="justify-self-end px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 shadow border border-red-400/30 text-sm"
              onClick={() => {
                if (confirm("Reset all counters?")) setState(defaultState);
              }}
            >
              Reset
            </button>
          </div>
        </header>
        {/* === VH selector (compact + even buttons) === */}
        <div className="mb-4 flex justify-center">
          <div className="w-full max-w-[520px] bg-slate-900/60 border border-slate-700/60 rounded-xl shadow px-3 sm:px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-slate-400 text-xs sm:text-sm">VH played:</span>
                    
              {/* 4 equal columns; buttons fill their cell */}
              <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-3">
                {state.cols.map((name, idx) => (
                  <button
                    key={name}
                    onClick={() => setActiveCol(activeCol === idx ? null : idx)}
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
          </div>
        </div>
        {/* === Card / Table === */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0f0f11] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed sm:table-auto">
              {/* Column widths via colgroup */}
              <colgroup>
                <col />
                {state.cols.map((_, i) => (
                  <col key={i} className="w-[4.5rem] sm:w-[5.5rem] md:w-[6rem]" />
                ))}
              </colgroup>

              <thead className="bg-black/30 backdrop-blur">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-slate-400">
                    <span className="hidden sm:inline">Rarity / Vault Hunter</span>
                    <span className="sm:hidden">Rarity</span>
                  </th>
                  {state.cols.map((c, ci) => (
                    <th
                      key={ci}
                      className={`px-1.5 sm:px-3 py-1.5 text-center ${
                        activeCol === ci ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <img
                          src={VH_ICONS[c]}
                          alt={c}
                          className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border border-slate-700/60"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span
                          className={`hidden sm:block text-base font-semibold ${
                            activeCol === ci ? "text-amber-300" : ""
                          }`}
                        >
                          {c}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {state.rows.map((r, ri) => {
                  const style = rarityStyles[r];
                  return (
                    <tr
                      key={ri}
                      className="border-t border-slate-800/80 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-2 align-middle">
                        <div
                          className={`inline-flex items-center gap-2 px-1.5 sm:px-3 py-1 rounded-full ${
                            "sm:border " + style.chip
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                          <span
                            className={`font-medium ${style.text} text-xs sm:text-sm hidden sm:inline`}
                          >
                            {r}
                          </span>
                        </div>
                      </td>

                      {state.cols.map((_, ci) => {
                        const v = state.counts[`${ri}-${ci}`] || 0;
                        const active = activeCol === ci;
                        return (
                          <td
                            key={ci}
                            className={`px-1 sm:px-2 md:px-3 py-2 text-center ${
                              active ? "bg-amber-500/5" : ""
                            }`}
                          >
                            <button
                              className={`w-full h-9 sm:h-11 rounded-xl border grid place-items-center select-none transition ${
                                active
                                  ? "border-amber-400/70 ring-2 ring-amber-400/40 bg-slate-900/70"
                                  : "border-slate-700/60 bg-slate-900/60 hover:bg-slate-900 focus:ring-2 focus:ring-amber-500/40"
                              }`}
                              title="Click: +1; Shift+Click: −1"
                              onClick={(e) => inc(ri, ci, e.shiftKey ? -1 : 1)}
                            >
                              <span className="text-sm sm:text-lg font-semibold tabular-nums">
                                {v}
                              </span>
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
                  <td className="px-3 sm:px-4 py-3 text-slate-400 text-xs sm:text-sm">
                    Loot share per VH
                  </td>
                  {state.cols.map((_, ci) => {
                    const total = colTotals[ci];
                    const pctNum = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
                    const pct = Math.round(pctNum * 10) / 10;
                    const active = activeCol === ci;
                    return (
                      <td
                        key={ci}
                        className={`px-1.5 sm:px-3 py-3 text-center ${
                          active ? "bg-amber-500/5" : ""
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-sm sm:text-base font-bold tabular-nums ${
                              active ? "text-amber-300" : ""
                            }`}
                          >
                            {pct.toFixed(1)}%
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-slate-400">
                            Total: {total}
                          </span>
                          <div className="hidden sm:block mt-1 h-2 w-24 sm:w-28 md:w-32 lg:w-36 mx-auto bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                            <div
                              style={{ width: `${pctNum}%` }}
                              className={`h-full ${
                                active ? "bg-amber-300" : "bg-amber-500"
                              } rounded-full`}
                            />
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
        </div>
      </div>
    </main>
  );
}
