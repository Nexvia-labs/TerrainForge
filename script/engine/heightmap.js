import { STATE, SURF, runtime } from './script/core/state.js';
import { getEquationFn } from './script/engine/equations.js';
import { sn } from './script/engine/noise.js';

export function buildHeightmap() {
  const res = STATE.res;
  const GRID = res + 1;
  const VC = GRID * GRID;
  const eq = getEquationFn(STATE.eq);
  const scl = STATE.scale, amp = STATE.amp;
  const riv = STATE.riverOn, rd = STATE.riverDepth, rw = STATE.riverWarp;
  const hmap = new Float32Array(VC);
  const s = SURF / res;

  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const wx = (i - res / 2) * s * scl, wy = (j - res / 2) * s * scl;

      let h = eq(wx, wy, 0) * amp;
      
      for (let li = 0; li < STATE.layers.length; li++) {
        const lay = STATE.layers[li];
        if (!lay.on || !lay.fn) continue;
        const lh = lay.fn(wx, wy, 0) * lay.op;
        if (lay.blend === 'add') h += lh;
        else if (lay.blend === 'multiply') h *= (1 + lh * .3);
        else if (lay.blend === 'subtract') h -= lh;
        else if (lay.blend === 'replace') h = h * (1 - lay.op) + lay.fn(wx, wy, 0) * lay.op;
      }
      
      if (riv) {
        const rwx = wx + rw * sn(wx * 0.5 + 3.1, wy * 0.5 + 1.7);
        const rwy = wy + rw * sn(wx * 0.5 + 8.4, wy * 0.5 + 4.3);
        const rv = Math.abs(sn(rwx * 0.7, rwy * 0.7));
        if (rv < 0.18) h -= rd * (0.18 - rv) / 0.18;
      }
      hmap[j * GRID + i] = h;
    }
  }
  
  let result = hmap;
  if (STATE.erosion > 0.01) result = erode(hmap, GRID, STATE.erosion);


  runtime.zMin = Infinity; runtime.zMax = -Infinity;
  for (let i = 0; i < VC; i++) {
    if (result[i] < runtime.zMin) runtime.zMin = result[i];
    if (result[i] > runtime.zMax) runtime.zMax = result[i];
  }
  return { hmap: result, GRID, s };
}


export function erode(hmap, G, str) {
  const out = new Float32Array(hmap.length);
  for (let j = 0; j < G; j++) {
    for (let i = 0; i < G; i++) {
      const c = hmap[j * G + i];
      const n = j > 0 ? hmap[(j - 1) * G + i] : c;
      const s2 = j < G - 1 ? hmap[(j + 1) * G + i] : c;
      const w = i > 0 ? hmap[j * G + i - 1] : c;
      const e = i < G - 1 ? hmap[j * G + i + 1] : c;
      const laplace = (n + s2 + w + e - 4 * c) * .25;
      out[j * G + i] = c + laplace * str * .3;
    }
  }
  return out;
}
