// ─────────────────────────────────────────────────────────────────
// MAIN — application entry point. Boots the three.js scene, wires
// every UI control, and drives the per-frame animation loop
// (water ripple, auto-rotate camera, deferred PNG export capture).
// ─────────────────────────────────────────────────────────────────

import { runtime } from './state.js';
import { initThree, applyCam } from './scene.js';
import { animateWater } from './water.js';
import { doExport } from './export.js';
import { bindEvents, syncAllUI } from './ui.js';
import { showHome } from './projects.js';
import { $ } from './utils.js';

let lastT = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastT) / 1000, .05);
  lastT = now;

  runtime.gTime += dt;
  animateWater(runtime.gTime);

  if (runtime.orb.autoRotate && !runtime.orb.dragging) {
    runtime.orb.theta += dt * .1;
    applyCam();
  }

  runtime.renderer.render(runtime.scene, runtime.camera);

  if (runtime.pendingExport) { doExport(); }
}

window.addEventListener('DOMContentLoaded', function () {
  try {
    initThree();
    bindEvents();
    syncAllUI();
    $('loading').style.display = 'none';
    showHome();
    animate();
  } catch (e) {
    console.error(e);
    $('loading').innerHTML =
      '<h2 style="color:#f04466">Initialisation Error</h2>' +
      '<p style="color:#a0b0c0;font-size:12px">' + e.message + '</p>';
  }
});
