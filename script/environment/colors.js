// ─────────────────────────────────────────────────────────────────
// COLORS — splat-map coloring of the terrain by normalised height
// and slope (deep water → shallow → sand → grass → forest → rock →
// snow), using the current palette in STATE.colors.
// ─────────────────────────────────────────────────────────────────

import { STATE, runtime } from '../core/state.js';

export function hex2rgb(hex) {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  ];
}

export function lerp3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function smooth(x, e0, e1) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** hn = normalised height [0..1], slope = normalised slope [0..1] */
export function splatColor(hn, slope) {
  const c = STATE.colors, sb = STATE.seaLevel, bw = STATE.beachW, bl = STATE.cBlend;
  const seaN = (sb - runtime.zMin) / (runtime.zMax - runtime.zMin);
  const cDeep = hex2rgb(c.deep);
  const cShallow = hex2rgb(c.shallow);
  const cSand = hex2rgb(c.sand);
  const cGrass = hex2rgb(c.grass);
  const cForest = hex2rgb(c.forest);
  const cRock = hex2rgb(c.rock);
  const cSnow = hex2rgb(c.snow);

  let rgb;
  if (hn < seaN - bw) {
    // Deep water
    rgb = lerp3(cDeep, cShallow, smooth(hn, seaN - bw * 3, seaN - bw));
  } else if (hn < seaN + bw) {
    // Beach transition
    if (hn < seaN) rgb = lerp3(cSand, cShallow, smooth(hn, seaN - bw, seaN));
    else rgb = lerp3(cSand, cGrass, smooth(hn, seaN, seaN + bw));
  } else {
    // Land biomes
    const sn2 = STATE.snowLine, flo = STATE.forestLo + seaN, fhi = STATE.forestHi;
    if (hn > sn2) {
      rgb = lerp3(cRock, cSnow, smooth(hn, sn2, sn2 + bl));
    } else if (slope > 0.55) {
      rgb = lerp3(cGrass, cRock, smooth(slope, 0.5, 0.75));
    } else if (hn > fhi) {
      rgb = lerp3(cForest, cRock, smooth(hn, fhi, fhi + bl));
    } else if (hn > flo) {
      rgb = lerp3(cGrass, cForest, smooth(hn, flo, fhi));
    } else {
      rgb = lerp3(cSand, cGrass, smooth(hn, seaN + bw, flo + bl));
    }
  }
  return rgb;
}
