// ─────────────────────────────────────────────────────────────────
// TOAST — small auto-dismissing notification popups
// ─────────────────────────────────────────────────────────────────

import { $ } from './script/utils/utils.js';

export function toast(title, body) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<div class="tt">' + title + '</div><div class="tb">' + body + '</div>';
  $('toast-box').appendChild(t);
  setTimeout(function () { if (t.parentNode) t.remove(); }, 4400);
}
