// src/components/BossTracker.jsx
// Responsive boss loot tracker
// - Mobile (<sm): stacked cards, no horizontal scroll
// - Desktop (sm+): table layout
// Includes per-item rates + combined "Any dedicated drop" rate
// Long-press (pointer events) subtracts reliably on mobile
// FIX: remove onClick (double-fire); pointer tap handles Shift too

import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "./Header";

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Long-press helpers (no UI changes) */
function useLongPress({ onTap, onLongPress, pressMs = 500, moveTolerance = 10 }) {
  const stateRef = useRef({
    timer: null,
    startX: 0,
    startY: 0,
    longFired: false,
    cancelled: false,
    pointerId: null,
    target: null,
  });

  const clearTimer = () => {
    const s = stateRef.current;
    if (s.timer) {
      clearTimeout(s.timer);
      s.timer = null;
    }
  };

  const onPointerDown = (e) => {
    const s = stateRef.current;
    s.longFired = false;
    s.cancelled = false;
    s.pointerId = e.pointerId;
    s.target = e.currentTarget;
    s.startX = e.clientX;
    s.startY = e.clientY;

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}

    clearTimer();
    s.timer = setTimeout(() => {
      s.timer = null;
      if (!s.cancelled && !s.longFired) {
        s.longFired = true;
        try {
          if (navigator.vibrate) navigator.vibrate(10);
        } catch {}
        onLongPress?.(e);
      }
    }, pressMs);
  };

  const onPointerMove = (e) => {
    const s = stateRef.current;
    if (s.timer == null) return;
    const dx = Math.abs(e.clientX - s.startX);
    const dy = Math.abs(e.clientY - s.startY);
    if (dx > moveTolerance || dy > moveTolerance) {
      s.cancelled = true;
      clearTimer();
    }
  };

  const finish = (e) => {
    const s = stateRef.current;
    try {
      s.target?.releasePointerCapture?.(s.pointerId);
    } catch {}
    const hadTimer = !!s.timer;
    clearTimer();
    if (!s.cancelled) {
      if (s.longFired) {
        // already handled
      } else if (hadTimer) {
        onTap?.(e); // single source of truth; no onClick used
      }
    }
  };

  const onPointerUp = finish;
  const onPointerCancel = finish;
  const onPointerLeave = finish;

  const onContextMenu = (e) => {
    // prevent Android long-press menu
    e.preventDefault();
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    onContextMenu,
  };
}

/** Count button wired to +1 tap, −1 long-press, Shift modifies tap on desktop */
function CountButton({ value, onInc, onDec, title }) {
  const handlers = useLongPress({
    onTap: (e) => {
      // Desktop nicety: Shift = −1, else +1
      if (e.shiftKey) onDec();
      else onInc();
    },
    onLongPress: () => onDec(),
    pressMs: 500,
    moveTolerance: 12,
  });

  return (
    <button
      className="w-full h-11 rounded-xl border grid place-items-center select-none transition
                 border-slate-700/60 bg-slate-900/60 hover:bg-slate-900
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
      title={title}
      // IMPORTANT: no onClick here (avoids +2 on desktop)
      {...handlers}
    >
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </button>
  );
}

export default function BossTracker({ bossName, drops, members }) {
  const COLS = useMemo(() => ["No drop", ...drops], [drops]);
  const STORAGE_KEY = `bl4-bosstracker-${slugify(bossName)}`;

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

  const dedicatedTotal = useMemo(() => {
    let sum = 0;
    for (let i = 1; i < COLS.length; i++) sum += counts[i] || 0;
    return sum;
  }, [COLS, counts]);

  const dedicatedPct = pct(dedicatedTotal);

  const dotClass = (ci) => (ci === 0 ? "bg-slate-400" : "bg-amber-400");
  const hint = "Tap: +1 • Hold: −1 • Shift (desktop): −1";

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-4 sm:p-6 md:p-10">
      <div className="mx-auto w-full max-w-5xl">
        <Header
          title={`${bossName} Loot Tracker`}
          subtitle={
            Array.isArray(members) && members.length > 0
              ? `Group members: ${members.join(", ")}`
              : undefined
          }
          onReset={() => {
            if (confirm("Reset this boss tracker?")) setCounts({});
          }}
        />

        {/* ===== MOBILE ===== */}
        <section className="sm:hidden space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/40 border border-slate-700/60">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="font-medium text-slate-200">{bossName}</span>
          </div>

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

                  <div className="shrink-0 w-16">
                    <CountButton
                      value={n}
                      onInc={() => inc(ci, +1)}
                      onDec={() => inc(ci, -1)}
                      title={hint}
                    />
                  </div>
                </div>

                <div className="mt-3 h-2 w-full bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            );
          })}

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
          <div className="rounded-2xl border border-slate-800/80 bg-[#0f0f11] shadow-2xl overflow-visible">
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <colgroup>
                  <col className="w-[180px]" />
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
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full sm:border bg-slate-800/40 border-slate-700/60">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="font-medium text-slate-200">{bossName}</span>
                      </div>
                    </td>

                    {COLS.map((_, ci) => {
                      const v = counts[ci] || 0;
                      return (
                        <td key={ci} className="px-2 py-2 text-center">
                          <CountButton
                            value={v}
                            onInc={() => inc(ci, +1)}
                            onDec={() => inc(ci, -1)}
                            title={hint}
                          />
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
        </section>
      </div>
    </main>
  );
}
