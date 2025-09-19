import React from "react";
import { Link } from "react-router-dom";
import logoSrc from "../assets/borderlands4-logo.png";

export default function Header({ title, onReset }) {
  return (
    <header className="mb-4 sm:mb-6">
      <div className="rounded-xl bg-slate-900/60 border border-slate-700/60 shadow px-3 sm:px-4 py-2">
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3">
          {/* Logo as Home button */}
          <Link
            to="/"
            className="rounded-full w-12 h-12 sm:w-14 sm:h-14
                       bg-slate-800/60 hover:bg-slate-700/60 transition
                       border border-slate-700/60 shadow
                       flex items-center justify-center overflow-hidden"
            style={{
              backgroundImage: `url(${logoSrc})`,
              backgroundSize: "auto 90%", // tweak if you want larger/smaller
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
            aria-label="Home"
          />

          {/* Title */}
          <h1 className="justify-self-center text-center text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-amber-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              <span className="hidden sm:inline">Borderlands 4</span>
              <span className="sm:hidden">BL4</span> —
            </span>{" "}
            <span className="text-slate-200">{title}</span>
          </h1>

          {/* Right actions */}
          <div className="justify-self-end flex items-center gap-2">
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
