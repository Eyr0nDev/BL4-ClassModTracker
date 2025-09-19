// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import Header from "../components/Header";
import bosses from "../data/bosses.json";

export default function Home() {
  const [query, setQuery] = useState("");

  // Build cards (ClassMods + Bosses) and filter by search
  const cards = useMemo(() => {
    const base = [
      {
        type: "classmods",
        title: "Class Mod Loot Tracker",
        chips: ["Per VH", "Rarity tracker"],
        href: "/classmods",
        desc: "Track rarity distribution per Vault Hunter.",
      },
      ...bosses.map((b) => ({
        type: "boss",
        title: b.name,           // group or solo display name
        chips: b.drops,          // drops as chips
        members: b.bosses || [], // optional: for grouped bosses
        href: `/boss/${b.slug}`,
        desc: "Track runs and drops.",
      })),
    ];

    const q = query.trim().toLowerCase();
    if (!q) return base;

    return base.filter((c) => {
      // classmods should not match unless the query fits its title/chips
      const inTitle = c.title.toLowerCase().includes(q);
      const inChips =
        Array.isArray(c.chips) &&
        c.chips.some((chip) => chip.toLowerCase().includes(q));

      // For grouped bosses, also search member names
      const inMembers =
        Array.isArray(c.members) &&
        c.members.some((m) => m.toLowerCase().includes(q));

      return inTitle || inChips || inMembers;
    });
  }, [query]);

  // helper: compact member list like “Frank…, Hank…, +1 more”
  const renderMembers = (members = []) => {
    if (!members.length) return null;
    const shown = members.slice(0, 2).join(", ");
    const extra = members.length - 2;
    return extra > 0 ? `${shown}, +${extra} more` : shown;
  };

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        <Header title="Loot Trackers Hub" />

        {/* Search (width limited on desktop, full on mobile) */}
        <div className="mx-auto w-full max-w-xl sm:max-w-2xl">
          <label
            htmlFor="home-search"
            className="block text-sm text-slate-400 mb-2"
          >
            Search bosses, groups, or drops
          </label>
          <input
            id="home-search"
            type="search"
            placeholder="e.g., Splashzone, Hellwalker, Foundry Freaks…"
            className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 px-4 py-3 text-slate-200 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-400/30"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Cards */}
        <section className="mt-5 grid gap-5 sm:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.href}
              to={c.href}
              className="group block rounded-2xl bg-slate-900/60 border border-slate-700/60 shadow p-5
                         hover:bg-slate-900/70 hover:border-amber-400/30 transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40
                         transform-gpu hover:-translate-y-[2px]"
            >
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight mb-1">
                {c.title}
              </h2>

              {/* If grouped, show compact member list under the title */}
              {Array.isArray(c.members) && c.members.length > 0 && (
                <p className="text-[12px] text-slate-400 mb-2">
                  Includes: {renderMembers(c.members)}
                </p>
              )}

              {/* Chips row (drops) */}
              {Array.isArray(c.chips) && c.chips.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {c.chips.slice(0, 6).map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center rounded-full border border-slate-700/60
                                 bg-slate-800/60 px-3 py-1 text-xs text-slate-300
                                 group-hover:border-amber-400/30"
                      title={chip}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              {c.desc && (
                <p className="text-slate-400 text-sm leading-relaxed">
                  {c.desc}
                </p>
              )}
            </Link>
          ))}
        </section>

        <p className="mt-6 text-center text-xs text-slate-500">
          Data is stored locally in your browser. No accounts. No tracking.
        </p>
      </div>
    </main>
  );
}
