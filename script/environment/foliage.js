// ─────────────────────────────────────────────────────────────────
// FOLIAGE — scatters trees and rocks across the terrain based on
// height/slope rules. Placement is seeded from STATE.seed (via the
// lcg() helper), so the same seed always reproduces the same
// tree/rock layout — not just the same underlying terrain shape.
// ─────────────────────────────────────────────────────────────────

import { STATE, SURF, runtime } from '../core/state.js';
import { $, lcg } from '../utils/utils.js';

export function buildTreeGeo() {
  return new THREE.ConeGeometry(0.7, 2, 7);
}

export function buildRockGeo() {
  return new THREE.DodecahedronGeometry(1, 0);
}

/**
 * Scatter trees and rocks across the terrain.
 * @param {object} data   heightmap data from buildHeightmap()
 * @param {Float32Array} slopes  per-vertex slope array from buildTerrainMesh()
 */
export function spawnFoliage(data, slopes) {
  const mkGrp = runtime.mkGrp;
  // Clear old
  while (mkGrp.children.length) mkGrp.remove(mkGrp.children[0]);
  runtime.treeCount = 0;
  runtime.rockCount = 0;

  const hmap = data.hmap, GRID = data.GRID, s = data.s;
  const zRng = runtime.zMax - runtime.zMin || 1;
  const seaN = (STATE.seaLevel - runtime.zMin) / zRng;
  const flo = STATE.forestLo + seaN, fhi = STATE.forestHi, sn2 = STATE.snowLine;
  const ms = STATE.maxSlope;
  const td = STATE.treeDensity, rd = STATE.rockDensity;

  const spacing = SURF / Math.max(1, Math.round(22 * td));
  const rspacing = SURF / Math.max(1, Math.round(14 * rd));

  const treeGeo = buildTreeGeo();
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2d6b24, roughness: 1.0 });
  const rockGeo = buildRockGeo();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a7d6e, roughness: 0.95, metalness: 0.05 });

  function sampleH(wx, wy) {
    let i = Math.round((wx + SURF / 2) / s);
    let j = Math.round((wy + SURF / 2) / s);
    i = Math.max(0, Math.min(GRID - 1, i));
    j = Math.max(0, Math.min(GRID - 1, j));
    return hmap[j * GRID + i];
  }
  function sampleSlope(wx, wy) {
    const i = Math.max(1, Math.min(GRID - 2, Math.round((wx + SURF / 2) / s)));
    const j = Math.max(1, Math.min(GRID - 2, Math.round((wy + SURF / 2) / s)));
    const idx = j * GRID + i;
    const dx = hmap[idx + 1] - hmap[idx - 1];
    const dz = hmap[idx + GRID] - hmap[idx - GRID];
    return Math.sqrt(dx * dx + dz * dz) / (s * 2);
  }

  // Seeded RNG (offset from the terrain seed) so foliage placement is
  // reproducible but doesn't line up 1:1 with the noise field's own samples.
  const rng = lcg(STATE.seed + 777);

  const half = SURF * 0.48;

  // Trees
  outerTrees:
  for (let wx = -half; wx < half; wx += spacing) {
    for (let wy = -half; wy < half; wy += spacing) {
      const jx = (rng() - 0.5) * spacing * 0.8;
      const jy = (rng() - 0.5) * spacing * 0.8;
      const sx = wx + jx, sy = wy + jy;
      const h = sampleH(sx, sy);
      const hn = (h - runtime.zMin) / zRng;
      const sl = sampleSlope(sx, sy);
      if (hn < flo || hn > fhi || sl > ms || hn < seaN + 0.02) continue;
      if (rng() > td) continue;
      const sc = 0.18 + rng() * 0.22;
      const tree = new THREE.Mesh(treeGeo, treeMat);
      tree.scale.setScalar(sc);
      tree.position.set(sx, h, sy);
      tree.rotation.y = rng() * Math.PI * 2;
      tree.castShadow = true;
      mkGrp.add(tree);
      runtime.treeCount++;
      if (runtime.treeCount > 1200) break outerTrees;
    }
  }

  // Rocks
  outerRocks:
  for (let wx = -half; wx < half; wx += rspacing) {
    for (let wy = -half; wy < half; wy += rspacing) {
      const jx = (rng() - 0.5) * rspacing * 0.9;
      const jy = (rng() - 0.5) * rspacing * 0.9;
      const sx = wx + jx, sy = wy + jy;
      const h = sampleH(sx, sy);
      const hn = (h - runtime.zMin) / zRng;
      const sl = sampleSlope(sx, sy);
      if (hn < seaN + 0.02 || hn > sn2 * 1.05) continue;
      if (sl < 0.3 && rng() > rd * 0.5) continue;
      if (rng() > rd * 0.7) continue;
      const scx = 0.1 + rng() * 0.18;
      const scy = 0.07 + rng() * 0.14;
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.scale.set(scx, scy, scx * (0.8 + rng() * 0.4));
      rock.position.set(sx, h - scx * 0.2, sy);
      rock.rotation.y = rng() * Math.PI * 2;
      rock.castShadow = true;
      mkGrp.add(rock);
      runtime.rockCount++;
      if (runtime.rockCount > 400) break outerRocks;
    }
  }

  $('s-trees').textContent = runtime.treeCount;
  $('s-rocks').textContent = runtime.rockCount;
}
