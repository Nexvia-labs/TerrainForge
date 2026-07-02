
import { STATE } from './script/core/state.js';

const G2 = 0.2113248654051871;
const grad3 = new Int8Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1,
  1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, 1
]);

// Fixed internal constant used only to shuffle the permutation table.
// This is an implementation detail of the Simplex algorithm, not a
// user-facing seed — it never changes and is never exposed.
const TABLE_KEY = 0x9e3779b1;

export class SimplexNoise {
  constructor() {
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 256; i++) this.p[i] = i;

    let state = TABLE_KEY;
    for (let i = 255; i > 0; i--) {
      state = (state * 1664525 + 1013904223) & 0xffffffff;
      const j = ((state >>> 16) & 0x7fff) % (i + 1);
      const tmp = this.p[i]; this.p[i] = this.p[j]; this.p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  noise2D(xin, yin) {
    const perm = this.perm, permMod12 = this.permMod12;
    let n0, n1, n2;
    const s = (xin + yin) * 0.3660254037844386;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2, X0 = i - t, Y0 = j - t, x0 = xin - X0, y0 = yin - Y0;
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const gi0 = permMod12[ii + perm[jj]] * 3;
    const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
    const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0; else { t0 *= t0; n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0; else { t1 *= t1; n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0; else { t2 *= t2; n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2); }

    return 70 * (n0 + n1 + n2);
  }
}

// Single shared noise instance — fixed forever, never reseeded.
const gNoise = new SimplexNoise();

/** Raw 2D simplex noise sample. */
export function sn(x, y) {
  return gNoise.noise2D(x, y);
}

/** Fractal Brownian Motion: layered octaves of noise. */
export function fbmN(x, y, oct, rough) {
  oct = oct || 6;
  rough = rough || STATE.rough;
  let val = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < oct; i++) {
    val += sn(x * freq, y * freq) * amp;
    max += amp; amp *= rough; freq *= 2.0;
  }
  return val / max;
}

/** Ridged noise: folds noise to create sharp mountain ridgelines. */
export function ridgeN(x, y) {
  let val = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < 6; i++) {
    let v = 1 - Math.abs(sn(x * freq, y * freq));
    v = v * v;
    val += v * amp; max += amp; amp *= 0.5; freq *= 2;
  }
  return val / max;
}

/** Domain warping: distorts the sample point before sampling noise. */
export function domWarp(x, y, s) {
  const wx = x + s * sn(x + 1.7, y + 9.2);
  const wy = y + s * sn(x + 8.3, y + 2.8);
  return sn(wx, wy);
}
