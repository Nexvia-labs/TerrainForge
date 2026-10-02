import { runtime } from './core/state.js';
import { initThree, applyCam } from './core/scene.js';
import { animateWater } from './environment/water.js';
import { doExport } from './utils/export.js';
import { bindEvents, syncAllUI } from './utils/ui.js';
import { updateDNA } from './utils/seed.js';
import { showHome } from './utils/projects.js';
import { $ } from './utils/utils.js';
import { ANIM, animTick } from './core/animation.js';

let lastT = performance.now();
let _wFrame = 0;

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastT) / 1000, .05);
  lastT = now;

  runtime.gTime += dt;
  // Water only needs to animate every 4th frame — its ripple is subtle
  // enough that this is imperceptible, and it's a nice perf win.
  if ((++_wFrame & 3) === 0) animateWater(runtime.gTime);

  // Camera keyframe animation system tick
  animTick(dt);

  // Smooth zoom lerp — eases the camera toward orb.targetRadius every
  // frame instead of snapping, so wheel/pinch/button zoom feels fluid.
  const orb = runtime.orb;
  if (Math.abs(orb.radius - orb.targetRadius) > 0.01) {
    orb.radius += (orb.targetRadius - orb.radius) * Math.min(1, dt * 10);
    applyCam();
  }

  if (orb.autoRotate && !orb.dragging && !ANIM.playing) {
    orb.theta += dt * .1;
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
    updateDNA();
    $('loading').style.display = 'none';
    showHome();
    animate();

    // ── EXPORT DROPDOWN ────────────────────────────────────────
    const expTrigger = $('btn-export-menu');
    const expDropdown = $('export-dropdown');
    const expWrap = $('export-menu-wrap');
    if (expTrigger && expDropdown) {
      function openExpMenu() {
        expDropdown.classList.add('open');
        expTrigger.classList.add('active');
      }
      function closeExpMenu() {
        expDropdown.classList.remove('open');
        expTrigger.classList.remove('active');
      }
      expTrigger.addEventListener('click', function (e) {
        e.stopPropagation();
        expDropdown.classList.contains('open') ? closeExpMenu() : openExpMenu();
      });
      document.addEventListener('click', function (e) {
        if (expWrap && !expWrap.contains(e.target)) closeExpMenu();
      });
      expDropdown.querySelectorAll('.exp-item').forEach(function (item) {
        item.addEventListener('click', function () {
          const realBtn = $(item.dataset.exp);
          closeExpMenu();
          setTimeout(function () { if (realBtn) realBtn.click(); }, 100);
        });
      });
    }

  } catch (e) {
    console.error(e);
    $('loading').innerHTML =
      '<h2 style="color:#f04466">Initialisation Error</h2>' +
      '<p style="color:#a0b0c0;font-size:12px">' + e.message + '</p>';
  }
});
