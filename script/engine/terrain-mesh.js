// ─────────────────────────────────────────────────────────────────
// TERRAIN MESH — turns a heightmap grid into a colored three.js
// BufferGeometry mesh (vertex-colored splat map, computed normals).
// ─────────────────────────────────────────────────────────────────

import { STATE, runtime } from '../core/state.js';
import { splatColor } from '../environment/colors.js';

/**
 * Build (or rebuild) the terrain mesh from heightmap data.
 * Returns the per-vertex slope array (used later for foliage rules).
 */
export function buildTerrainMesh(data) {
  const scene = runtime.scene;
  if (runtime.terrainMesh) {
    scene.remove(runtime.terrainMesh);
    runtime.terrainMesh.geometry.dispose();
    runtime.terrainMesh.material.dispose();
  }
  const hmap = data.hmap, GRID = data.GRID, s = data.s;
  const res = GRID - 1;
  const geo = new THREE.BufferGeometry();
  const VC = GRID * GRID;
  const pos = new Float32Array(VC * 3);
  const col = new Float32Array(VC * 3);
  const uv = new Float32Array(VC * 2);

  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const idx = j * GRID + i;
      const wx = (i - res / 2) * s, wy = (j - res / 2) * s;
      const h = hmap[idx];
      pos[idx * 3] = wx; pos[idx * 3 + 1] = h; pos[idx * 3 + 2] = wy;
      uv[idx * 2] = i / res; uv[idx * 2 + 1] = j / res;
    }
  }

  // Compute slope from a rough finite-difference approximation
  const slopes = new Float32Array(VC);
  for (let j = 1; j < GRID - 1; j++) {
    for (let i = 1; i < GRID - 1; i++) {
      const idx = j * GRID + i;
      const dx = hmap[idx + 1] - hmap[idx - 1];
      const dz = hmap[idx + GRID] - hmap[idx - GRID];
      slopes[idx] = Math.sqrt(dx * dx + dz * dz) / (s * 2);
    }
  }

  const zRng = runtime.zMax - runtime.zMin || 1;
  for (let k = 0; k < VC; k++) {
    const hn = (hmap[k] - runtime.zMin) / zRng;
    const sl = Math.min(1, slopes[k]);
    const rgb = splatColor(hn, sl);
    col[k * 3] = rgb[0]; col[k * 3 + 1] = rgb[1]; col[k * 3 + 2] = rgb[2];
  }

  // Indices
  const idxBuf = new Uint32Array(res * res * 6);
  let p = 0;
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const a = j * GRID + i, b = a + 1, c = a + GRID, d = c + 1;
      idxBuf[p++] = a; idxBuf[p++] = c; idxBuf[p++] = b;
      idxBuf[p++] = b; idxBuf[p++] = c; idxBuf[p++] = d;
    }
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idxBuf, 1));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.9, metalness: 0.0,
    wireframe: STATE.wireframe, flatShading: STATE.flatShade,
    side: THREE.FrontSide
  });
  const terrainMesh = new THREE.Mesh(geo, mat);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = false;
  scene.add(terrainMesh);
  runtime.terrainMesh = terrainMesh;

  return slopes;
}
