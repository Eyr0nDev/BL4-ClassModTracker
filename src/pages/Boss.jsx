import React from "react";
import { useParams, Link } from "react-router-dom";
import bosses from "../data/bosses.json";
import BossTracker from "../components/BossTracker";
import Header from "../components/Header";
import usePageMeta from "../hooks/usePageMeta";

export default function Boss() {
  const { slug } = useParams();
  const boss = bosses.find((b) => b.slug === slug);

  if (boss) {
    usePageMeta({
      title: `VaultDrops — ${boss.name} Loot Tracker`,
      description: `Track loot drops and runs for ${boss.name} in Borderlands 4.`,
      canonicalPath: `/boss/${slug}`,
    });

    return (
      <BossTracker
        bossName={boss.name}
        drops={boss.drops}
        alsoFrom={boss.bosses || []}
      />
    );
  }

  // 404 fallback
  usePageMeta({
    title: "VaultDrops — Boss not found",
    description: "This boss could not be found. Check the URL or browse the full list on VaultDrops.",
    canonicalPath: `/boss/${slug}`,
  });

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-slate-100 p-6 sm:p-10">
      <div className="mx-auto w-full max-w-5xl">
        <Header title="Boss not found" />

        <section className="rounded-xl bg-slate-900/60 border border-slate-700/60 shadow p-5">
          <h2 className="text-xl font-bold mb-2">No boss with slug “{slug}”.</h2>
          <p className="text-slate-400 mb-4">
            Check the URL or pick a boss from the hub.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2
                       bg-slate-800/70 hover:bg-slate-700/70 transition
                       border border-slate-700/60"
          >
            <span aria-hidden>←</span> Back to Home
          </Link>
        </section>
      </div>
    </main>
  );
}
