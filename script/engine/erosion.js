import { STATE, runtime } from '../core/state.js';
import { lcg } from '../utils/utils.js';

/** Laplacian smoothing — cheap, general-purpose softening of the terrain. */
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

/**
 * Thermal (talus) erosion — simulates rockslides: wherever the slope to a
 * neighbor exceeds the talus angle, sediment slips downhill toward it.
 */
export function erodeThermally(hmap, G, talusDeg, iters) {
  iters = iters || 30;
  const talus = Math.tan(talusDeg * Math.PI / 180) * (20 / (G - 1)); // world-space slope threshold
  const strength = 0.5;
  const out = new Float32Array(hmap);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (let it = 0; it < iters; it++) {
    for (let j = 1; j < G - 1; j++) {
      for (let i = 1; i < G - 1; i++) {
        const c = out[j * G + i];
        let maxDiff = 0, maxDi = 0, maxDj = 0;
        for (let d = 0; d < dirs.length; d++) {
          const ni = i + dirs[d][0], nj = j + dirs[d][1];
          if (ni < 0 || ni >= G || nj < 0 || nj >= G) continue;
          const diff = c - out[nj * G + ni];
          if (diff > maxDiff) { maxDiff = diff; maxDi = dirs[d][0]; maxDj = dirs[d][1]; }
        }
        if (maxDiff > talus) {
          const transfer = (maxDiff - talus) * strength * 0.5;
          out[j * G + i] -= transfer;
          out[(j + maxDj) * G + (i + maxDi)] += transfer;
        }
      }
    }
  }
  return out;
}

/**
 * Hydraulic droplet erosion — simulates raindrops carrying sediment
 * downhill, carving valleys and depositing at flat regions. Also
 * accumulates a flow map (which cells water crossed most) that can be
 * overlaid on the mesh afterward to show river-like paths.
 */
export function erodeHydraulic(hmap, G, params) {
  const numDroplets = params.droplets || 60000;
  const inertia = params.inertia || 0.05;
  const sedCap = 4.0;
  const erosionRate = params.eroRate || 0.3;
  const depositRate = params.depRate || 0.3;
  const evapRate = params.evap || 0.02;
  const minSlope = 0.001;
  const gravity = 20;
  const maxSteps = 32;
  const radius = 1;

  const map = new Float32Array(hmap);
  const flowMap = new Float32Array(G * G); // accumulate water flow

  const rng = lcg(STATE.seed + 9999);

  // Bilinear height sample
  function sampleH(x, y) {
    let xi = Math.floor(x), yi = Math.floor(y);
    const u = x - xi, v = y - yi;
    xi = Math.max(0, Math.min(G - 2, xi));
    yi = Math.max(0, Math.min(G - 2, yi));
    return map[yi * G + xi] * (1 - u) * (1 - v) +
      map[yi * G + xi + 1] * u * (1 - v) +
      map[(yi + 1) * G + xi] * (1 - u) * v +
      map[(yi + 1) * G + xi + 1] * u * v;
  }

  // Gradient of height (for direction)
  function gradient(x, y) {
    let xi = Math.floor(x), yi = Math.floor(y);
    const u = x - xi, v = y - yi;
    xi = Math.max(0, Math.min(G - 2, xi));
    yi = Math.max(0, Math.min(G - 2, yi));
    const h00 = map[yi * G + xi], h10 = map[yi * G + xi + 1];
    const h01 = map[(yi + 1) * G + xi], h11 = map[(yi + 1) * G + xi + 1];
    const gx = (h10 - h00) * (1 - v) + (h11 - h01) * v;
    const gy = (h01 - h00) * (1 - u) + (h11 - h10) * u;
    return { x: gx, y: gy };
  }

  // Deposit sediment at position (bilinear)
  function deposit(x, y, amount) {
    let xi = Math.floor(x), yi = Math.floor(y);
    const u = x - xi, v = y - yi;
    xi = Math.max(0, Math.min(G - 2, xi));
    yi = Math.max(0, Math.min(G - 2, yi));
    map[yi * G + xi] += amount * (1 - u) * (1 - v);
    map[yi * G + xi + 1] += amount * u * (1 - v);
    map[(yi + 1) * G + xi] += amount * (1 - u) * v;
    map[(yi + 1) * G + xi + 1] += amount * u * v;
  }

  // Erode at position (bilinear weighted)
  function erodeAt(x, y, amount) {
    let xi = Math.floor(x), yi = Math.floor(y);
    const u = x - xi, v = y - yi;
    xi = Math.max(0, Math.min(G - 2, xi));
    yi = Math.max(0, Math.min(G - 2, yi));
    const r = radius;
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        const ni = xi + di, nj = yi + dj;
        if (ni < 0 || ni >= G || nj < 0 || nj >= G) continue;
        const w = Math.max(0, 1 - (Math.abs(di) + Math.abs(dj)) / (r + 1));
        map[nj * G + ni] -= amount * w;
      }
    }
  }

  for (let drop = 0; drop < numDroplets; drop++) {
    let px = rng() * (G - 2) + 0.5;
    let py = rng() * (G - 2) + 0.5;
    let vx = 0, vy = 0, speed = 0, water = 1.0, sediment = 0;

    for (let step = 0; step < maxSteps; step++) {
      const grad = gradient(px, py);
      const gLen = Math.sqrt(grad.x * grad.x + grad.y * grad.y) || 1;

      // New direction blends inertia with downslope
      vx = vx * inertia - grad.x * (1 - inertia);
      vy = vy * inertia - grad.y * (1 - inertia);
      const vLen = Math.sqrt(vx * vx + vy * vy) || 0.0001;
      vx /= vLen; vy /= vLen;

      const nx = px + vx, ny = py + vy;
      if (nx < 0 || nx >= G || ny < 0 || ny >= G) break;

      const oldH = sampleH(px, py);
      const newH = sampleH(nx, ny);
      const dh = newH - oldH;

      // Sediment capacity
      const cap = Math.max(-dh, minSlope) * speed * water * sedCap;

      if (sediment > cap || dh > 0) {
        // Deposit
        let dep = dh > 0 ? Math.min(sediment, dh) : (sediment - cap) * depositRate;
        dep = Math.max(0, dep);
        sediment -= dep;
        deposit(px, py, dep);
      } else {
        // Erode
        let ero = Math.min((cap - sediment) * erosionRate, -dh);
        ero = Math.max(0, ero);
        sediment += ero;
        erodeAt(px, py, ero);
      }

      // Update speed & flow
      speed = Math.sqrt(Math.max(0, speed * speed - dh * gravity));
      water *= (1 - evapRate);

      // Record flow
      const fi = Math.min(G - 1, Math.max(0, Math.round(px)));
      const fj = Math.min(G - 1, Math.max(0, Math.round(py)));
      flowMap[fj * G + fi] += 1;

      px = nx; py = ny;
      if (water < 0.01) break;
    }
  }

  // Normalise flow map 0..1
  let fMax = 0;
  for (let i = 0; i < flowMap.length; i++) if (flowMap[i] > fMax) fMax = flowMap[i];
  if (fMax > 0) for (let i = 0; i < flowMap.length; i++) flowMap[i] /= fMax;

  return { hmap: map, flowMap: flowMap };
}

/** Blend the flow map into the mesh's vertex colors as a teal river overlay. */
export function applyFlowMapOverlay() {
  if (!runtime.terrainMesh || !runtime.flowMap) return;
  const geo = runtime.terrainMesh.geometry;
  const col = geo.attributes.color.array;
  const GRID = Math.round(Math.sqrt(col.length / 3));
  for (let k = 0; k < GRID * GRID; k++) {
    const flow = runtime.flowMap[k] || 0;
    if (flow > 0.05) {
      const t = Math.min(1, flow * 3);
      // Blend toward teal river color
      col[k * 3] = col[k * 3] * (1 - t) + 0.12 * t;
      col[k * 3 + 1] = col[k * 3 + 1] * (1 - t) + 0.55 * t;
      col[k * 3 + 2] = col[k * 3 + 2] * (1 - t) + 0.85 * t;
    }
  }
  geo.attributes.color.needsUpdate = true;
}
