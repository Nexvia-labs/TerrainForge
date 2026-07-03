// ─────────────────────────────────────────────────────────────────
// STATS — updates the on-screen peak height / water / biome panel
// ─────────────────────────────────────────────────────────────────

import { STATE, runtime } from '../core/state.js';
import { $ } from './utils.js';

export function updateStats() {
  $('s-peak').textContent = runtime.zMax.toFixed(2) + 'u';
  $('s-water').textContent = STATE.seaLevel.toFixed(2) + 'u';
  const zRng = runtime.zMax - runtime.zMin || 1;
  const seaN = (STATE.seaLevel - runtime.zMin) / zRng;
  const waterCov = Math.round(seaN * 100) + '%';
  $('s-cov').textContent = waterCov + ' water';

  let biome = 'Temperate';
  if (seaN > 0.5) biome = 'Archipelago';
  else if (STATE.snowLine < 0.6) biome = 'Arctic';
  else if (STATE.forestLo > 0.3) biome = 'Highland';
  else if (seaN < 0.05) biome = 'Arid';
  $('s-biome').textContent = biome;
  $('s-biome').style.color = 'var(--go)';
}
