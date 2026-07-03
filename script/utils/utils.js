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
