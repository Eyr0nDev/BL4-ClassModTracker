// src/components/Header.jsx
import { Link } from "react-router-dom";
import Logo from "../assets/vaultdropssimple.png";

export default function Header({
  title,
  backTo,     // optional: string route to go back to
  onReset,    // optional: () => void
  rightSlot,  // optional: React node (e.g., Publish button / extra actions)
}) {
  return (
    <header className="mb-4 sm:mb-6">
      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/60 shadow px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: home logo + optional back + title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Home / logo */}
            <Link
              to="/"
              className="shrink-0 inline-grid place-items-center rounded-full border border-slate-700/60 bg-slate-800/60
                         w-10 h-10 sm:w-14 sm:h-14 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
              title="VaultDrops — Home"
              aria-label="VaultDrops — Home"
            >
              <img
                src={Logo}
                alt="VaultDrops"
                className="w-6 h-6 sm:w-9 sm:h-9 object-contain"
              />
            </Link>

            {/* Optional back button */}
            {backTo && (
              <Link
                to={backTo}
                className="inline-flex items-center rounded-xl border border-slate-700/60 bg-slate-800/60
                           px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 focus:outline-none
                           focus-visible:ring-2 focus-visible:ring-amber-400/40"
                title="Back"
              >
                ← <span className="ml-1 hidden xs:inline">Back</span>
              </Link>
            )}

            {/* Title */}
            <h1 className="justify-self-center text-center text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-amber-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              <span className="hidden sm:inline">Borderlands 4</span>
              <span className="sm:hidden">BL4</span> —
            </span>{" "}
            <span className="text-slate-200">{title}</span>
          </h1>
          </div>

          {/* Right: extra actions + Reset */}
          <div className="flex items-center gap-2 shrink-0">
            {rightSlot}

            {onReset && (
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow
                           border border-red-400/40 text-sm"
                title="Reset"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
