// Wilson score interval (95%) for binomial proportion
// Returns { p, lo, hi, moe } where moe = ± margin of error in percentage points
export function wilsonCI(successes, trials, z = 1.96) {
  const n = trials;
  if (!n) return { p: 0, lo: 0, hi: 0, moe: 0 };
  const phat = successes / n;

  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = phat + z2 / (2 * n);
  const rad = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * n)) / n);

  const lo = Math.max(0, (center - rad) / denom);
  const hi = Math.min(1, (center + rad) / denom);

  const p = phat;
  const moe = ((hi - lo) * 50) * 2; // half-width in pct points *2 to get full width;
  return { p, lo, hi, moe: (hi - p) * 100 }; // return ±half-width as moe
}
