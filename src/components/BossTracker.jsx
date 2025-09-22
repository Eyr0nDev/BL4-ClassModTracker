// Responsive boss loot tracker with community averages (Supabase)
// - Mobile: stacked cards (no horizontal scroll)
// - Desktop: table
// - “Publish to VaultDrops” sends your local counts (per boss) to Supabase
// - Community panel aggregates all submissions, shows Wilson CI

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Header from "./Header";
import { supabase } from "../lib/supabase";
import { getClientId } from "../lib/clientId";
import { wilsonCI } from "../lib/stats";

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function BossTracker({ bossSlug, bossName, drops, alsoFrom = [] }) {
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

  // --- publish to Supabase ---
  const [pubState, setPubState] = useState({ loading: false, ok: false, err: "" });

  const publish = useCallback(async () => {
    if (!bossSlug) {
      setPubState({ loading: false, ok: false, err: "Missing boss key." });
      return;
    }
    if (totalRuns === 0) {
      setPubState({ loading: false, ok: false, err: "Nothing to publish yet." });
      return;
    }
    setPubState({ loading: true, ok: false, err: "" });

    const client_hash = getClientId();
    const payload = {
      boss_slug: bossSlug,
      client_hash,
      total_runs: totalRuns,
      counts_json: counts,
      submitted_at: new Date().toISOString(),
      app_ver: "web-1",
    };

    // upsert on (boss_slug, client_hash)
    const { error } = await supabase
      .from("submissions")
      .upsert(payload, { onConflict: "boss_slug,client_hash" });

    if (error) {
      setPubState({ loading: false, ok: false, err: error.message || "Publish failed." });
    } else {
      setPubState({ loading: false, ok: true, err: "" });
      // refresh community aggregates after publish
      fetchCommunity();
    }
  }, [bossSlug, counts, totalRuns]);

  // --- community averages ---
  const [community, setCommunity] = useState({
    loading: true,
    err: "",
    submissions: 0,
    sampleRuns: 0,
    perCol: [], // [{label, n, pct, moe}]
    any: { pct: 0, moe: 0, n: 0 },
  });

  const fetchCommunity = useCallback(async () => {
    if (!bossSlug) return;
    setCommunity((p) => ({ ...p, loading: true, err: "" }));
    const { data, error } = await supabase
      .from("submissions")
      .select("counts_json,total_runs")
      .eq("boss_slug", bossSlug);

    if (error) {
      setCommunity((p) => ({ ...p, loading: false, err: error.message || "Failed to load community stats." }));
      return;
    }

    let submissions = data.length;
    let sampleRuns = 0;

    // aggregate counts per column index
    const sums = new Array(COLS.length).fill(0);
    for (const row of data) {
      const c = row.counts_json || {};
      sampleRuns += row.total_runs || 0;
      for (let i = 0; i < COLS.length; i++) {
        sums[i] += c[i] || 0;
      }
    }

    const totalAll = sums.reduce((a, b) => a + b, 0);
    const perCol = COLS.map((label, i) => {
      const n = sums[i] || 0;
      const ci = wilsonCI(n, totalAll || 0);
      return { label, n, pct: ci.p * 100, moe: ci.moe };
    });

    // any dedicated = sum of i>=1
    const anyN = sums.slice(1).reduce((a, b) => a + b, 0);
    const anyCI = wilsonCI(anyN, totalAll || 0);

    setCommunity({
      loading: false,
      err: "",
      submissions,
      sampleRuns: totalAll,
      perCol,
      any: { pct: anyCI.p * 100, moe: anyCI.moe, n: anyN },
    });
  }, [bossSlug, COLS]);

  useEffect(() => {
    fetchCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bossSlug]);

  const dotClass = (ci) => (ci === 0 ? "bg-slate-400" : "bg-amber-400");

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-4 sm:p-6 md:p-10">
      <div className="mx-auto w-full max-w-5xl">
        <Header
          title={`${bossName} Loot Tracker`}
          onReset={() => {
            if (confirm("Reset this boss tracker?")) setCounts({});
          }}
          rightSlot={
            <div className="flex items-center gap-2">
              {alsoFrom.length > 0 && (
                <div className="hidden sm:block text-xs text-slate-400 mr-2">
                  Also includes: <span className="text-slate-300">{alsoFrom.join(", ")}</span>
                </div>
              )}
              <button
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow border border-emerald-400/30 text-sm disabled:opacity-60"
                onClick={publish}
                disabled={pubState.loading}
                title="Publish your current counters to VaultDrops (anonymous). Re-publishing updates your previous submission."
              >
                {pubState.loading ? "Publishing…" : pubState.ok ? "Published ✓" : "Publish"}
              </button>
            </div>
          }
        />

        {/* ===== MOBILE: stacked cards (no horizontal scroll) ===== */}
        <section className="sm:hidden space-y-3">
          {/* Boss label + group */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/40 border border-slate-700/60">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="font-medium text-slate-200">{bossName}</span>
          </div>
          {alsoFrom.length > 0 && (
            <p className="text-[11px] text-slate-400">Also includes: {alsoFrom.join(", ")}</p>
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
                    title="Tap: +1 • Long-press: −1 (or use Shift on desktop)"
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
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${p}%` }} />
                </div>
              </div>
            );
          })}

          {/* Combined dedicated rate */}
          <div className="rounded-xl bg-black/20 border border-slate-800/80 px-3 py-2 text-center text-[11px] text-slate-300">
            Any dedicated drop:&nbsp;
            <span className="font-semibold tabular-nums">{dedicatedPct.toFixed(1)}%</span>{" "}
            <span className="text-slate-400">(Total: {dedicatedTotal} / Runs: {totalRuns})</span>
            <div className="mt-2 h-2 w-full bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${dedicatedPct}%` }} />
            </div>
          </div>

          {/* Community averages (mobile) */}
          <CommunityPanel community={community} drops={drops} compact />
          <div className="rounded-xl bg-black/20 border border-slate-800/80 px-3 py-2 text-[11px] text-slate-500">
            Data saved locally.
          </div>
        </section>

        {/* ===== DESKTOP: table ===== */}
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
                    <th className="text-left px-3 sm:px-4 py-3 text-slate-400">Boss / Result</th>
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
                      {alsoFrom.length > 0 && (
                        <div className="mt-1 text-[11px] text-slate-400">
                          Also includes: {alsoFrom.join(", ")}
                        </div>
                      )}
                    </td>

                    {COLS.map((_, ci) => {
                      const v = counts[ci] || 0;
                      return (
                        <td key={ci} className="px-2 py-2 text-center">
                          <button
                            className="w-full h-11 rounded-xl border grid place-items-center select-none transition
                                       border-slate-700/60 bg-slate-900/60 hover:bg-slate-900
                                       focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                            title="Click: +1 • Shift+Click: −1"
                            aria-label={`Increment ${COLS[ci]}`}
                            onClick={(e) => inc(ci, e.shiftKey ? -1 : 1)}
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
                            <span className="text-[10px] sm:text-[11px] text-slate-400">Total: {n}</span>
                            <div className="mt-1 h-2 w-28 md:w-32 bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                              <div style={{ width: `${p}%` }} className="h-full bg-amber-500 rounded-full" />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Combined dedicated + Community */}
            <div className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-center text-slate-300 border-t border-slate-800/80 bg-black/20">
              Any dedicated drop:&nbsp;
              <span className="font-semibold tabular-nums">{dedicatedPct.toFixed(1)}%</span>{" "}
              <span className="text-slate-400">(Total: {dedicatedTotal} / Runs: {totalRuns})</span>
              <div className="mt-2 mx-auto h-2 w-40 md:w-56 bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${dedicatedPct}%` }} />
              </div>
            </div>

            <CommunityPanel community={community} drops={drops} />

            <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-slate-500 border-t border-slate-800/80 bg-black/20">
              Data saved locally.
            </div>
          </div>

          {pubState.err && (
            <p className="mt-3 text-sm text-red-400">Publish error: {pubState.err}</p>
          )}
        </section>
      </div>
    </main>
  );
}

function CommunityPanel({ community, drops, compact = false }) {
  return (
    <div className={`border-t border-slate-800/80 bg-black/20 ${compact ? "rounded-xl mt-3 p-3" : "px-3 sm:px-4 py-3"}`}>
      <div className={`flex ${compact ? "flex-col gap-2" : "items-center justify-between"}`}>
        <div className="text-slate-300 font-semibold">Community rates</div>
        <div className="text-[11px] text-slate-400">
          {community.loading
            ? "Loading…"
            : community.err
            ? community.err
            : `${community.submissions} submissions • ${community.sampleRuns} runs`}
        </div>
      </div>

      {!community.loading && !community.err && community.sampleRuns > 0 && (
        <div className={`mt-2 ${compact ? "" : "grid grid-cols-1 md:grid-cols-2 gap-3"}`}>
          {/* Any dedicated */}
          <div className={`${compact ? "" : "rounded-xl border border-slate-800/80 bg-[#0f0f11] p-3"}`}>
            <div className="text-sm text-slate-300 font-semibold mb-1">Any dedicated</div>
            <div className="text-slate-200 text-base font-bold">
              {community.any.pct.toFixed(1)}%
              <span className="text-slate-400 text-xs"> ±{(community.any.moe).toFixed(1)}</span>
              <span className="text-slate-500 text-[11px] ml-2">(n={community.any.n})</span>
            </div>
            <div className="mt-2 h-2 w-40 bg-slate-900 rounded-full border border-slate-700/60 shadow-inner">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${community.any.pct}%` }}
              />
            </div>
          </div>

          {/* Per item (exclude “No drop”) */}
          <div className={`${compact ? "" : "rounded-xl border border-slate-800/80 bg-[#0f0f11] p-3"}`}>
            <div className="text-sm text-slate-300 font-semibold mb-2">Per-item rates</div>
            <div className="flex flex-wrap gap-2">
              {community.perCol.slice(1).map((c, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-[11px] text-slate-200"
                  title={`${c.label}: ${c.pct.toFixed(1)}% ±${c.moe.toFixed(1)} (95% CI, n=${c.n})`}
                >
                  {c.label}: {c.pct.toFixed(1)}%
                  <span className="text-slate-400">&nbsp;±{c.moe.toFixed(1)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
