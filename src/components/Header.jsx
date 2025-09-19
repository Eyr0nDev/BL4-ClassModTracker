/**
 * Universal page header for the app.
 *
 * Props:
 * - title: string (required) – page title text shown next to the logo
 * - backTo?: string – if provided, shows a BackLink on the left
 * - backLabel?: string – label for the back link (default "Back to Home")
 * - onReset?: () => void – if provided, shows a red "Reset" button on the right
 * - rightSlot?: ReactNode – optional custom element on the right (e.g., extra actions)
 */

import React from "react";
import BackLink from "./BackLink";
import logoSrc from "../assets/borderlands4-logo.png";

export default function Header({
  title,
  backTo,
  backLabel = "Back to Home",
  onReset,
  rightSlot,
}) {
  return (
    <header className="mb-4 sm:mb-6">
      {/* Row with optional BackLink */}
      <div className="mb-2">
        {backTo ? (
          <BackLink to={backTo} label={backLabel} />
        ) : (
          <span className="inline-block h-8" />
        )}
      </div>

      {/* Main band */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-700/60 shadow px-3 sm:px-4 py-2">
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3">
          {/* Logo */}
          <img
            src={logoSrc}
            alt="BL4"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          {/* Title (centered) */}
          <h1 className="justify-self-center text-center text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-amber-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Borderlands 4 —
            </span>{" "}
            <span className="text-slate-200">{title}</span>
          </h1>

          {/* Right actions */}
          <div className="justify-self-end flex items-center gap-2">
            {rightSlot}
            {onReset && (
              <button
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 shadow border border-red-400/30 text-sm"
                onClick={onReset}
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
