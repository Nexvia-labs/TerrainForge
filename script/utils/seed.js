// ─────────────────────────────────────────────────────────────────
// SEED — the "Seed" tab: the Map DNA card (complexity/biome/rarity/
// name, all derived from the current seed + settings) and the
// base64 map-code system used to share an exact terrain with someone
// else.
// ─────────────────────────────────────────────────────────────────

import { STATE, runtime } from '../core/state.js';
import { $ } from './utils.js';
import { syncAllUI } from './ui.js';
import { generate } from '../engine/generator.js';

/** Refresh the Map Seed / Complexity / Biome / Rarity / Name card. */
export function updateDNA() {
  $('d-seed').textContent = STATE.seed;

  let cmx = (STATE.eq.length + (STATE.layers.length * 4)) * 1.2;
  if (STATE.eq.indexOf('fbm') >= 0) cmx += 10;
  if (STATE.eq.indexOf('ridge') >= 0) cmx += 8;
  if (STATE.eq.indexOf('warp') >= 0) cmx += 12;
  $('d-cmx').textContent = Math.round(cmx);

  const h = STATE.seed % 100;
  const names = ['Obsidian Peaks', 'Crystal Flats', 'Verdant Reaches', 'Ember Highlands',
    'Fog Marshes', 'Iron Ridges', 'Silver Coast', 'Thorn Basin', 'Amber Plateau', 'Storm Isle',
    'Jade Steppes', 'Ash Caldera', 'Sapphire Delta', 'Copper Spires', 'Bone Flats'];
  $('d-sig').textContent = names[h % names.length];

  const zRng = runtime.zMax - runtime.zMin || 1;
  const seaN = (STATE.seaLevel - runtime.zMin) / zRng;
  let biome = 'Temperate';
  if (seaN > 0.5) biome = 'Archipelago';
  else if (STATE.snowLine < 0.6) biome = 'Arctic';
  else if (STATE.forestLo > 0.3) biome = 'Highland';
  else if (seaN < 0.05) biome = 'Arid';
  $('d-biome').textContent = biome;

  let rar = 'Common', rc = 'rc';
  if (h > 88) { rar = 'Legendary'; rc = 'rl'; }
  else if (h > 66) { rar = 'Rare'; rc = 'rr'; }
  else if (h > 38) { rar = 'Uncommon'; rc = 'ru'; }
  $('d-rar').textContent = rar; $('d-rar').className = 'rb ' + rc;
}

/** Encode the current seed + core settings into a shareable base64 code. */
export function buildMapCode() {
  return btoa(JSON.stringify({
    eq: STATE.eq, seed: STATE.seed, scale: STATE.scale, amp: STATE.amp,
    oct: STATE.oct, rough: STATE.rough, seaLevel: STATE.seaLevel,
    snowLine: STATE.snowLine, riverOn: STATE.riverOn,
    colors: STATE.colors,
    layers: STATE.layers.map(function (l) { return { eq: l.eq, blend: l.blend, op: l.op, on: l.on }; })
  }));
}

/** Decode a map code produced by buildMapCode() and regenerate the terrain. */
export function loadMapCode(code) {
  try {
    const s = JSON.parse(atob(code));
    if (s.eq) STATE.eq = s.eq;
    if (s.seed != null) STATE.seed = s.seed;
    if (s.scale != null) STATE.scale = s.scale;
    if (s.amp != null) STATE.amp = s.amp;
    if (s.oct != null) STATE.oct = s.oct;
    if (s.rough != null) STATE.rough = s.rough;
    if (s.seaLevel != null) STATE.seaLevel = s.seaLevel;
    if (s.snowLine != null) STATE.snowLine = s.snowLine;
    if (s.riverOn != null) STATE.riverOn = s.riverOn;
    if (s.colors) STATE.colors = Object.assign(STATE.colors, s.colors);
    syncAllUI();
    generate();
    return true;
  } catch (e) {
    return false;
  }
}
