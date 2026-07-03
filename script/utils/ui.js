// ─────────────────────────────────────────────────────────────────
// UI — wires up every control in the panel (sliders, toggles, the
// equation box, presets, layers, color pickers, tabs, the top bar,
// the save modal, and keyboard shortcuts) and keeps STATE in sync
// with the DOM in both directions.
// ─────────────────────────────────────────────────────────────────

import { STATE, runtime, DEFAULT_EQUATION } from '../core/state.js';
import { $ } from './utils.js';
import { generate } from '../engine/generator.js';
import { addLayer } from '../environment/layers.js';
import { buildTerrainMesh } from '../engine/terrain-mesh.js';
import { buildWater } from '../environment/water.js';
import { trigExport } from './export.js';
import { toast } from './toast.js';
import { showHome, showVisualizer, showSaveModal, hideSaveModal, doSave } from './projects.js';

// ── STATE → UI ───────────────────────────────────────────────────

export function syncAllUI() {
  function sv(id, v) { const e = $(id); if (e) e.value = v; }
  function svt(id, v) { const e = $(id); if (e) e.textContent = v; }

  sv('terrain-eq', STATE.eq);
  sv('sl-scale', STATE.scale); svt('v-scale', STATE.scale.toFixed(2));
  sv('sl-amp', STATE.amp); svt('v-amp', STATE.amp.toFixed(1));
  sv('sl-oct', STATE.oct); svt('v-oct', STATE.oct);
  sv('sl-rough', STATE.rough); svt('v-rough', STATE.rough.toFixed(2));
  sv('sl-res', STATE.res); svt('v-res', STATE.res);
  sv('sl-ero', STATE.erosion); svt('v-ero', STATE.erosion.toFixed(2));
  sv('sl-sea', STATE.seaLevel); svt('v-sea', STATE.seaLevel.toFixed(2));
  sv('sl-walpha', STATE.wAlpha); svt('v-walpha', STATE.wAlpha.toFixed(2));
  sv('sl-wsp', STATE.wSpeed); svt('v-wsp', STATE.wSpeed.toFixed(2));
  sv('sl-wh', STATE.wHeight); svt('v-wh', STATE.wHeight.toFixed(2));
  sv('sl-rdepth', STATE.riverDepth); svt('v-rdepth', STATE.riverDepth.toFixed(2));
  sv('sl-rwarp', STATE.riverWarp); svt('v-rwarp', STATE.riverWarp.toFixed(2));
  sv('sl-trees', STATE.treeDensity); svt('v-trees', STATE.treeDensity.toFixed(2));
  sv('sl-rocks', STATE.rockDensity); svt('v-rocks', STATE.rockDensity.toFixed(2));
  sv('sl-snow', STATE.snowLine); svt('v-snow', STATE.snowLine.toFixed(2));
  sv('sl-flo', STATE.forestLo); svt('v-flo', STATE.forestLo.toFixed(2));
  sv('sl-fhi', STATE.forestHi); svt('v-fhi', STATE.forestHi.toFixed(2));
  sv('sl-mslope', STATE.maxSlope); svt('v-mslope', STATE.maxSlope.toFixed(2));
  sv('sl-cblend', STATE.cBlend); svt('v-cblend', STATE.cBlend.toFixed(2));
  sv('sl-beach', STATE.beachW); svt('v-beach', STATE.beachW.toFixed(3));

  // Colors
  Object.keys(STATE.colors).forEach(function (k) {
    const e = $('c-' + k); if (e) e.value = STATE.colors[k];
  });

  $('tr-tog').classList.toggle('on', STATE.riverOn);
  $('tc-tog').classList.toggle('on', STATE.autoRotate);
  $('tw-tog').classList.toggle('on', STATE.wireframe);
  $('tf-tog').classList.toggle('on', STATE.flatShade);
}

// ── TOGGLE SWITCH HELPER ──────────────────────────────────────────

function tog(wrapId, togId, key, cb) {
  const wrap = $(wrapId), togEl = $(togId);
  if (!wrap || !togEl) return;
  wrap.addEventListener('click', function () {
    STATE[key] = !STATE[key];
    togEl.classList.toggle('on', STATE[key]);
    if (cb) cb(STATE[key]);
  });
  togEl.classList.toggle('on', STATE[key]);
}

// ── BIND ALL EVENTS ───────────────────────────────────────────────

export function bindEvents() {
  // Sliders
  const sliders = [
    ['sl-scale', 'scale', 2], ['sl-amp', 'amp', 1], ['sl-oct', 'oct', 0],
    ['sl-rough', 'rough', 2], ['sl-res', 'res', 0], ['sl-ero', 'erosion', 2],
    ['sl-sea', 'seaLevel', 2], ['sl-walpha', 'wAlpha', 2],
    ['sl-wsp', 'wSpeed', 2], ['sl-wh', 'wHeight', 2],
    ['sl-rdepth', 'riverDepth', 2], ['sl-rwarp', 'riverWarp', 2],
    ['sl-trees', 'treeDensity', 2], ['sl-rocks', 'rockDensity', 2],
    ['sl-snow', 'snowLine', 2], ['sl-flo', 'forestLo', 2], ['sl-fhi', 'forestHi', 2],
    ['sl-mslope', 'maxSlope', 2], ['sl-cblend', 'cBlend', 2], ['sl-beach', 'beachW', 3]
  ];
  sliders.forEach(function (s) {
    const el = $(s[0]); if (!el) return;
    el.addEventListener('input', function () {
      STATE[s[1]] = parseFloat(el.value);
      const vEl = $('v-' + s[0].replace('sl-', ''));
      if (vEl) vEl.textContent = parseFloat(el.value).toFixed(s[2]);
    });
  });

  // Equation
  $('terrain-eq').addEventListener('input', function () {
    STATE.eq = $('terrain-eq').value;
    $('terrain-eq').classList.remove('ie');
  });
  $('terrain-eq').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { generate(); }
  });

  // Preset
  $('preset-sel').addEventListener('change', function () {
    if (!$('preset-sel').value) return;
    STATE.eq = $('preset-sel').value;
    $('terrain-eq').value = STATE.eq;
    $('preset-sel').value = '';
    generate();
  });

  // Generate button
  $('btn-regen').addEventListener('click', function () { generate(); });

  // Toggles
  tog('tog-wire', 'tw-tog', 'wireframe', function (v) {
    if (runtime.terrainMesh) runtime.terrainMesh.material.wireframe = v;
  });
  tog('tog-flat', 'tf-tog', 'flatShade', function (v) {
    if (runtime.terrainMesh) { runtime.terrainMesh.material.flatShading = v; runtime.terrainMesh.material.needsUpdate = true; }
  });
  tog('tog-cam', 'tc-tog', 'autoRotate', function (v) { runtime.orb.autoRotate = v; });
  tog('tog-river', 'tr-tog', 'riverOn', function () {});

  // Color inputs
  ['deep', 'shallow', 'sand', 'grass', 'forest', 'rock', 'snow'].forEach(function (k) {
    const el = $('c-' + k); if (!el) return;
    el.addEventListener('input', function () { STATE.colors[k] = el.value; });
  });
  $('btn-apply-color').addEventListener('click', function () {
    if (runtime.heightCache) buildTerrainMesh(runtime.heightCache);
    buildWater();
    toast('Colors Applied', 'Splat map updated.');
  });

  // Layers
  $('b-lay').addEventListener('click', function () { addLayer(); });
  $('b-lay-clr').addEventListener('click', function () {
    $('lay-con').innerHTML = ''; STATE.layers = [];
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      const pane = $('tab-' + btn.dataset.tab);
      if (pane) pane.classList.add('active');
    });
  });

  // UI toggle
  $('utog').addEventListener('click', function () {
    const col = !$('terrain-ui').classList.contains('collapsed');
    $('terrain-ui').classList.toggle('collapsed', col);
    $('utog').textContent = col ? '▲' : '▼';
  });

  // Top bar
  $('btn-back-home').addEventListener('click', showHome);
  $('btn-save-proj').addEventListener('click', showSaveModal);
  $('btn-export').addEventListener('click', trigExport);
  $('btn-new-proj').addEventListener('click', function () {
    runtime.currentProjectId = null;
    STATE.eq = DEFAULT_EQUATION;
    syncAllUI();
    showVisualizer();
    generate();
  });

  // Save modal
  $('save-confirm').addEventListener('click', doSave);
  $('save-cancel').addEventListener('click', hideSaveModal);
  $('proj-name-inp').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSave();
    if (e.key === 'Escape') hideSaveModal();
  });
  $('save-modal').addEventListener('click', function (e) { if (e.target === $('save-modal')) hideSaveModal(); });

  // Keyboard
  window.addEventListener('keydown', function (e) {
    const act = document.activeElement;
    if (act === $('terrain-eq') || act === $('proj-name-inp')) {
      if (e.key === 'Escape') act.blur();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      runtime.orb.autoRotate = !runtime.orb.autoRotate;
      $('tc-tog').classList.toggle('on', runtime.orb.autoRotate);
    }
    if (e.key.toLowerCase() === 'g') generate();
    if (e.key.toLowerCase() === 'h') $('utog').click();
    if (e.key.toLowerCase() === 'e') trigExport();
    if (e.key.toLowerCase() === 'w') $('tog-wire').click();
  });
}
