// src/pages/Home.jsx
import { Link } from "react-router-dom";
import Header from "../components/Header";
import bosses from "../data/bosses.json";

export default function Home() {
  const cards = [
    {
      title: "Class Mod Loot Tracker",
      desc: "Track rarity distribution per Vault Hunter. Local save, mobile friendly.",
      href: "/classmods",
    },
    // Boss cards from JSON
    ...bosses.map((b) => ({
      title: b.name,
      desc: `Track runs and drops: ${b.drops.join(", ")}.`,
      href: `/boss/${b.slug}`,
    })),
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        <Header title="Loot Trackers Hub" />
        <section className="grid gap-5 sm:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.href}
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
