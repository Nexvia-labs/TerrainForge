// ─────────────────────────────────────────────────────────────────
// UTILS — small, dependency-free helpers shared across modules
// ─────────────────────────────────────────────────────────────────


export const $ = (id) => document.getElementById(id);


export function escH(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


export function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}


/**
 * Tiny seeded RNG (linear congruential generator). Returns a function that
 * yields a new pseudo-random float in [0,1) on every call. The same seed
 * always produces the same sequence — this is what lets foliage placement
 * reproduce exactly whenever a seed or map code is shared.
 */
export function lcg(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
