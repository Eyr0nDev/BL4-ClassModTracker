// Responsive boss loot tracker
// - Mobile (<sm): stacked cards, no horizontal scroll
// - Desktop (sm+): table layout
//   * If many columns (>7 including "No drop"): split into two stacked half-tables to avoid horizontal scroll
// Includes per-item rates + combined "Any dedicated drop" rate

import React, { useEffect, useMemo, useState } from "react";
import Header from "./Header";

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BossTracker({ bossName, drops, members = [] }) {
  // Prepend "No drop" to the list
  const COLS = useMemo(() => ["No drop", ...drops], [drops]);
  const STORAGE_KEY = `bl4-bosstracker-${slugify(bossName)}`;

  // --- storage ---
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.counts ?? {};
    } catch {
      return {};
    }
  };
  const [counts, setCounts] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ counts }));
    } catch {}
  }, [counts, STORAGE_KEY]);

  // --- helpers ---
  const inc = (ci, d = 1) =>
    setCounts((p) => {
      const n = Math.max(0, (p[ci] || 0) + d);
      return { ...p, [ci]: n };
    });

  const totalRuns = useMemo(
    () => COLS.reduce((s, _, ci) => s + (counts[ci] || 0), 0),
    [COLS, counts]
  );

  const pct = (n) => (totalRuns ? Math.round((n / totalRuns) * 1000) / 10 : 0);

  // Combined dedicated (exclude "No drop" at index 0)
  const dedicatedTotal = useMemo(() => {
    let sum = 0;
    for (let i = 1; i < COLS.length; i++) sum += counts[i] || 0;
    return sum;
  }, [COLS, counts]);
  const dedicatedPct = pct(dedicatedTotal);

  const dotClass = (ci) => (ci === 0 ? "bg-slate-400" : "bg-amber-400");

  // ===== Desktop wide-mode splitting =====
  const WIDE_THRESHOLD = 8; // number of result columns including "No drop"
  const isWide = COLS.length > 7; // switch to two halves when over 7 columns

  const firstCount = Math.ceil(COLS.length / 2);
  const firstIdxs = Array.from({ length: firstCount }, (_, i) => i);
  const secondIdxs = Array.from(
    { length: COLS.length - firstCount },
    (_, i) => i + firstCount
  );

  // Small helper to render one compact desktop table for a subset of column indexes
  const DesktopHalfTable = ({ colIdxs, showBoss = false, topLabel = "" }) => (
    <div className="rounded-2xl border border-slate-800/80 bg-[#0f0f11] shadow-2xl overflow-visible">
      <div className="relative overflow-x-hidden">
        <table className="w-full text-sm">
          <colgroup>
            <col className="w-[200px]" />
            {colIdxs.map((_, i) => (
              <col key={i} className="w-[7rem] md:w-[7.5rem]" />
            ))}
          </colgroup>

          <thead className="bg-black/30 backdrop-blur">
            <tr>
              <th className="text-left px-3 sm:px-4 py-3 text-slate-400">
                {topLabel || "Boss / Result"}
              </th>
              {colIdxs.map((ci) => (
                <th key={ci} className="px-2 py-2 text-center text-slate-200 font-semibold">
                  {COLS[ci]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className="border-t border-slate-800/80 hover:bg-white/5 transition-colors">
              <td className="px-3 sm:px-4 py-3 align-middle">
                {showBoss ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full sm:border bg-slate-800/40 border-slate-700/60">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="font-medium text-slate-200">{bossName}</span>
                    </div>
                    {Array.isArray(members) && members.length > 0 && (
                      <p className="text-xs text-slate-400">
                        Includes: {members.join(", ")}
                      </p>
                    )}
                  </div>
                ) : (
                  // Keep height consistent if not showing boss again
                  <div className="h-[2.25rem]" />
                )}
              </td>

              {colIdxs.map((ci) => {
                const v = counts[ci] || 0;
                return (
                  <td key={ci} className="px-2 py-2 text-center">
                    <button
                      className="w-full h-11 rounded-xl border grid place-items-center select-none transition
                                 border-slate-700/60 bg-slate-900/60 hover:bg-slate-900
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                      title="Click: +1 • Shift+Click or Right-Click: −1"
                      aria-label={`Increment ${COLS[ci]}`}
                      onClick={(e) => inc(ci, e.shiftKey ? -1 : 1)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        inc(ci, -1);
                      }}
                    >
                      <span className="text-base font-semibold tabular-nums">{v}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>

          <tfoot className="border-t border-slate-800/80">
            <tr>
              <td className="px-3 sm:px-4 py-3 text-slate-400 text-xs sm:text-sm">
                Drop rate (of all runs)
              </td>
              {colIdxs.map((ci) => {
                const n = counts[ci] || 0;
                const p = pct(n);
                return (
                  <td key={ci} className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm sm:text-base font-bold tabular-nums">
                        {p.toFixed(1)}%
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400">
                        Total: {n}
                      </span>
                      <div className="mt-1 h-2 w-28 md:w-32 bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                        <div
                          style={{ width: `${p}%` }}
                          className="h-full bg-amber-500 rounded-full"
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
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-4 sm:p-6 md:p-10">
      <div className="mx-auto w-full max-w-5xl">
        <Header
          title={`${bossName} Loot Tracker`}
          onReset={() => {
            if (confirm("Reset this boss tracker?")) setCounts({});
          }}
        />

        {/* ===== MOBILE: stacked cards (no horizontal scroll) ===== */}
        <section className="sm:hidden space-y-3">
          {/* Boss label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/40 border border-slate-700/60">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="font-medium text-slate-200">{bossName}</span>
          </div>
          {Array.isArray(members) && members.length > 0 && (
            <p className="text-xs text-slate-400">Includes: {members.join(", ")}</p>
          )}

          {COLS.map((label, ci) => {
            const n = counts[ci] || 0;
            const p = pct(n);
            return (
              <div
                key={ci}
                className="rounded-xl bg-[#0f0f11] border border-slate-800/80 shadow px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-200 font-semibold truncate flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotClass(ci)}`} />
                      {label}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {p.toFixed(1)}% • Total: {n}
                    </p>
                  </div>

                  <button
                    className="shrink-0 w-16 h-10 rounded-xl border border-slate-700/60
                               bg-slate-900/60 hover:bg-slate-900
                               grid place-items-center select-none transition
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                    title="Tap: +1 • Long-press or Right-Click: −1 (Shift on desktop)"
                    aria-label={`Increment ${label}`}
                    onClick={(e) => inc(ci, e.shiftKey ? -1 : 1)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      inc(ci, -1);
                    }}
                  >
                    <span className="text-base font-semibold tabular-nums">{n}</span>
                  </button>
                </div>

                {/* progress */}
                <div className="mt-3 h-2 w-full bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Combined dedicated rate */}
          <div className="rounded-xl bg-black/20 border border-slate-800/80 px-3 py-2 text-center text-[11px] text-slate-300">
            Any dedicated drop:&nbsp;
            <span className="font-semibold tabular-nums">
              {dedicatedPct.toFixed(1)}%
            </span>{" "}
            <span className="text-slate-400">
              (Total: {dedicatedTotal} / Runs: {totalRuns})
            </span>
            <div className="mt-2 h-2 w-full bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${dedicatedPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-black/20 border border-slate-800/80 px-3 py-2 text-center text-[11px] text-slate-400">
            Runs logged: <span className="font-semibold text-slate-200">{totalRuns}</span>
          </div>
          <div className="rounded-xl bg-black/20 border border-slate-800/80 px-3 py-2 text-[11px] text-slate-500">
            Data saved locally.
          </div>
        </section>

        {/* ===== DESKTOP ===== */}
        <section className="hidden sm:block">
          {!isWide ? (
            // Normal single-table layout
            <div className="rounded-2xl border border-slate-800/80 bg-[#0f0f11] shadow-2xl overflow-visible">
              <div className="relative overflow-x-hidden">
                <table className="w-full text-sm">
                  <colgroup>
                    <col className="w-[200px]" />
                    {COLS.map((_, i) => (
                      <col key={i} className="w-[7rem] md:w-[7.5rem]" />
                    ))}
                  </colgroup>

                  <thead className="bg-black/30 backdrop-blur">
                    <tr>
                      <th className="text-left px-3 sm:px-4 py-3 text-slate-400">
                        Boss / Result
                      </th>
                      {COLS.map((c, ci) => (
                        <th key={ci} className="px-2 py-2 text-center text-slate-200 font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="border-t border-slate-800/80 hover:bg-white/5 transition-colors">
                      <td className="px-3 sm:px-4 py-3 align-middle">
                        <div className="flex flex-col gap-1.5">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full sm:border bg-slate-800/40 border-slate-700/60">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="font-medium text-slate-200">{bossName}</span>
                          </div>
                          {Array.isArray(members) && members.length > 0 && (
                            <p className="text-xs text-slate-400">
                              Includes: {members.join(", ")}
                            </p>
                          )}
                        </div>
                      </td>

                      {COLS.map((_, ci) => {
                        const v = counts[ci] || 0;
                        return (
                          <td key={ci} className="px-2 py-2 text-center">
                            <button
                              className="w-full h-11 rounded-xl border grid place-items-center select-none transition
                                         border-slate-700/60 bg-slate-900/60 hover:bg-slate-900
                                         focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                              title="Click: +1 • Shift+Click or Right-Click: −1"
                              aria-label={`Increment ${COLS[ci]}`}
                              onClick={(e) => inc(ci, e.shiftKey ? -1 : 1)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                inc(ci, -1);
                              }}
                            >
                              <span className="text-base font-semibold tabular-nums">{v}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>

                  <tfoot className="border-t border-slate-800/80">
                    <tr>
                      <td className="px-3 sm:px-4 py-3 text-slate-400 text-xs sm:text-sm">
                        Drop rate (of all runs)
                      </td>
                      {COLS.map((_, ci) => {
                        const n = counts[ci] || 0;
                        const p = pct(n);
                        return (
                          <td key={ci} className="px-2 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm sm:text-base font-bold tabular-nums">
                                {p.toFixed(1)}%
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-slate-400">
                                Total: {n}
                              </span>
                              <div className="mt-1 h-2 w-28 md:w-32 bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                                <div
                                  style={{ width: `${p}%` }}
                                  className="h-full bg-amber-500 rounded-full"
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

              {/* Combined dedicated rate strip */}
              <div className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-center text-slate-300 border-t border-slate-800/80 bg-black/20">
                Any dedicated drop:&nbsp;
                <span className="font-semibold tabular-nums">
                  {dedicatedPct.toFixed(1)}%
                </span>{" "}
                <span className="text-slate-400">
                  (Total: {dedicatedTotal} / Runs: {totalRuns})
                </span>
                <div className="mt-2 mx-auto h-2 w-40 md:w-56 bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${dedicatedPct}%` }}
                  />
                </div>
              </div>

              <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-slate-400 border-t border-slate-800/80 bg-black/20 text-center">
                Runs logged: <span className="font-semibold text-slate-200">{totalRuns}</span>
              </div>
              <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-slate-500 border-t border-slate-800/80 bg-black/20">
                Data saved locally.
              </div>
            </div>
          ) : (
            // Wide: two compact half-tables stacked
            <div className="space-y-4">
              <DesktopHalfTable colIdxs={firstIdxs} showBoss topLabel="Boss / Result (Part 1)" />
              <DesktopHalfTable colIdxs={secondIdxs} showBoss={false} topLabel="Boss / Result (Part 2)" />

              {/* Combined dedicated rate + totals below both halves */}
              <div className="rounded-2xl border border-slate-800/80 bg-[#0f0f11] shadow-2xl overflow-visible">
                <div className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-center text-slate-300 border-b border-slate-800/80 bg-black/20">
                  Any dedicated drop:&nbsp;
                  <span className="font-semibold tabular-nums">
                    {dedicatedPct.toFixed(1)}%
                  </span>{" "}
                  <span className="text-slate-400">
                    (Total: {dedicatedTotal} / Runs: {totalRuns})
                  </span>
                  <div className="mt-2 mx-auto h-2 w-40 md:w-56 bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${dedicatedPct}%` }}
                    />
                  </div>
                </div>

                <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-slate-400 bg-black/20 text-center">
                  Runs logged: <span className="font-semibold text-slate-200">{totalRuns}</span>
                </div>
                <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-slate-500 border-t border-slate-800/80 bg-black/20">
                  Data saved locally.
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}