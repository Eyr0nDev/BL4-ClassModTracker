import React from "react";
import { useParams, Link } from "react-router-dom";
import bosses from "../data/bosses.json";
import BossTracker from "../components/BossTracker";

export default function Boss() {
  const { slug } = useParams();
  const boss = bosses.find((b) => b.slug === slug);

  if (!boss) {
    return (
      <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-extrabold mb-2">Boss not found</h1>
          <p className="text-slate-400 mb-4">No boss with slug “{slug}”.</p>
          <Link
            to="/"
            className="inline-block rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 hover:bg-slate-800 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return <BossTracker bossName={boss.name} drops={boss.drops} />;
}
