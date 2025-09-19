import { Link } from "react-router-dom";
import Header from "../components/Header";
import bosses from "../data/bosses.json";

export default function Home() {
  // First, the fixed “Class Mods” card, then JSON-driven boss cards.
  const cards = [
    {
      type: "classmods",
      title: "Class Mod Loot Tracker",
      chips: ["Per VH", "Rarity tracker"],
      href: "/classmods",
    },
    ...bosses.map((b) => ({
      type: "boss",
      title: b.name,
      chips: b.drops, // we’ll render as little rounded chips
      href: `/boss/${b.slug}`,
      desc: `Track runs and drops.`,
    })),
  ];

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
            Search bosses or drops
          </label>
          <input
            id="home-search"
            type="search"
            placeholder="e.g., Splashzone, Lead Balloon, Hellwalker…"
            className="w-full rounded-xl bg-slate-900/60 border border-slate-700/60 px-4 py-3 text-slate-200 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-400/30"
            // (wire up later when we add search behaviour)
            onChange={() => {}}
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
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight mb-2">
                {c.title}
              </h2>

              {/* Chips row (consistent for both types) */}
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

              {/* Secondary line (kept subtle so UI isn’t “Christmas tree”) */}
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
