/**
 * Pill back link used across pages.
 */

import { Link } from "react-router-dom";

export default function BackLink({
  to = "/",
  label = "Back to Home",
  className = "",
}) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-full
                  px-3 py-1.5 text-sm
                  bg-slate-900/60 border border-slate-700/60 text-slate-300
                  hover:bg-slate-800 hover:text-white
                  shadow-sm transition
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40
                  ${className}`}
      aria-label={label}
    >
      <span
        className="inline-grid place-items-center h-5 w-5 rounded-full
                   bg-slate-800/70 border border-slate-700/60
                   group-hover:bg-slate-700/70"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 -ml-px transition-transform group-hover:-translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
