// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  const cards = [
    {
      title: "Class Mod Loot Tracker",
      desc: "Track rarity distribution per Vault Hunter. Local save, mobile friendly.",
      href: "/classmods",
    },
    {
      title: "Splaszone",
      desc: "Track runs and drops: Lead Balloon, Fireworks, Jelly.",
      href: "/boss/splaszone",
    },
    {
      title: "Voraxis",
      desc: "Track runs and drops: Darkbeast, Potato Thrower IV, Buoy.",
      href: "/boss/voraxis",
    },
    {
      title: "The Oppressor",
      desc: "Track runs and drops: Streamer, Asher’s Rise, Blood Analyser.",
      href: "/boss/oppressor",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="rounded-xl bg-slate-900/60 border border-slate-700/60 shadow px-4 py-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-center">
            <span className="bg-gradient-to-r from-amber-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Borderlands 4 —
            </span>{" "}
            <span className="text-slate-200">Loot Trackers Hub</span>
          </h1>
        </header>

        <section className="grid gap-5 sm:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.title}
              to={c.href}
              className="rounded-xl bg-slate-900/60 border border-slate-700/60 shadow p-5 hover:bg-slate-800/70 transition block"
            >
              <h2 className="text-lg font-bold mb-1">{c.title}</h2>
              <p className="text-slate-400 text-sm">{c.desc}</p>
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
