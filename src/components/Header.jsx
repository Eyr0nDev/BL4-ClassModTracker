// src/components/Header.jsx
import { Link } from "react-router-dom";

export default function Header({
  title,
  backTo,           // optional: string route to go back to
  onReset,          // optional: () => void
  rightSlot,        // optional: React node (e.g., Publish button / extra actions)
}) {
  return (
    <header className="mb-4 sm:mb-6">
      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/60 shadow px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            {backTo && (
              <Link
                to={backTo}
                className="inline-flex items-center rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                title="Back"
              >
                ← Back
              </Link>
            )}
            <h1 className="truncate text-xl sm:text-2xl font-extrabold tracking-tight">
              {title}
            </h1>
          </div>

          {/* Right: extra actions + Reset */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Anything the page wants to put on the right (e.g., Publish) */}
            {rightSlot}

            {onReset && (
              <button
                onClick={onReset}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow border border-red-400/40 text-sm"
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
