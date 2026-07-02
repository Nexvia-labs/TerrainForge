// ─────────────────────────────────────────────────────────────────
// WATER — the translucent sea-level plane and its per-frame wave
// animation.
// ─────────────────────────────────────────────────────────────────

import { STATE, SURF, runtime } from './script/core/state.js';
import { hex2rgb } from './script/environment/colors.js';

export function buildWater() {
  const scene = runtime.scene;
  if (runtime.waterMesh) {
    scene.remove(runtime.waterMesh);
    runtime.waterMesh.geometry.dispose();
    runtime.waterMesh.material.dispose();
  }
  const geo = new THREE.PlaneGeometry(SURF * 1.5, SURF * 1.5, 48, 48);
  geo.rotateX(-Math.PI / 2);
  const wc = hex2rgb(STATE.colors.shallow);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wc[0], wc[1], wc[2]),
    transparent: true, opacity: STATE.wAlpha,
    roughness: 0.1, metalness: 0.3,
    side: THREE.DoubleSide
  });
  const waterMesh = new THREE.Mesh(geo, mat);
  waterMesh.position.y = STATE.seaLevel;
  scene.add(waterMesh);
  runtime.waterMesh = waterMesh;
}

/** Per-frame ripple animation, driven by the global clock `t`. */
export function animateWater(t) {
  const waterMesh = runtime.waterMesh;
  if (!waterMesh) return;
  const pos = waterMesh.geometry.attributes.position;
  const arr = pos.array;
  const wh = STATE.wHeight, ws = STATE.wSpeed;
  for (let i = 0; i < pos.count; i++) {
    const x = arr[i * 3], z = arr[i * 3 + 2];
    arr[i * 3 + 1] = STATE.seaLevel + Math.sin(x * 0.4 + t * ws) * wh + Math.cos(z * 0.35 + t * ws * 0.8) * wh * 0.6;
  }
  pos.needsUpdate = true;
}
