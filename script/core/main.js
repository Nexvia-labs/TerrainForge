import { runtime } from './script/core/state.js';
import { initThree, applyCam } from './script/core/scene.js';
import { animateWater } from './script/environment/water.js';
import { doExport } from './script/utils/export.js';
import { bindEvents, syncAllUI } from './script/utils/ui.js';
import { showHome } from './script/utils/projects.js';
import { $ } from './script/utils/utils.js';

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
