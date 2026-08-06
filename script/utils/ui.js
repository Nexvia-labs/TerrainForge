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
import { trigExport, exportOBJ, exportGLB, exportSplatmap, exportHeightmap16 } from './export.js';
import { toast } from './toast.js';
import { updateDNA, buildMapCode, loadMapCode } from './seed.js';
import { NG } from './nodegraph.js';
import { applyFlowMapOverlay } from '../engine/erosion.js';
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
  sv('sl-droplets', STATE.droplets); svt('v-droplets', STATE.droplets);
  sv('sl-inertia', STATE.inertia); svt('v-inertia', STATE.inertia.toFixed(2));
  sv('sl-eroRate', STATE.eroRate); svt('v-eroRate', STATE.eroRate.toFixed(2));
  sv('sl-depRate', STATE.depRate); svt('v-depRate', STATE.depRate.toFixed(2));
  sv('sl-evap', STATE.evap); svt('v-evap', STATE.evap.toFixed(3));
  sv('sl-talus', STATE.talusAngle); svt('v-talus', STATE.talusAngle);
  sv('sl-thermiters', STATE.thermIters); svt('v-thermiters', STATE.thermIters);
  updateErosionTypeUI(STATE.erosionType);
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
  sv('seed-in', STATE.seed);

  // Colors
  Object.keys(STATE.colors).forEach(function (k) {
    const e = $('c-' + k); if (e) e.value = STATE.colors[k];
  });

  $('tr-tog').classList.toggle('on', STATE.riverOn);
  $('tc-tog').classList.toggle('on', STATE.autoRotate);
  $('tw-tog').classList.toggle('on', STATE.wireframe);
  $('tf-tog').classList.toggle('on', STATE.flatShade);
  $('tfm-tog').classList.toggle('on', STATE.showFlowMap);
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

// ── EROSION TYPE UI HELPER ─────────────────────────────────────────
// Shared by the type-button click handler and syncAllUI so the active
// button, visible control group, and status chip can never drift out
// of sync with STATE.erosionType (e.g. after loading a saved project).

function updateErosionTypeUI(etype) {
  document.querySelectorAll('.ero-type-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.etype === etype);
  });
  const lapC = $('ero-laplacian-controls');
  const hydC = $('ero-hydraulic-controls');
  const thrC = $('ero-thermal-controls');
  if (lapC) lapC.style.display = (etype === 'laplacian' || etype === 'none') ? '' : 'none';
  if (hydC) hydC.style.display = (etype === 'hydraulic' || etype === 'both') ? '' : 'none';
  if (thrC) thrC.style.display = (etype === 'thermal' || etype === 'both') ? '' : 'none';
  const labels = { none: 'Off', laplacian: 'Laplacian Smooth', thermal: 'Thermal Rockslide', hydraulic: 'Hydraulic Droplets', both: 'Thermal + Hydraulic' };
  const chip = $('ero-chip'); if (chip) chip.textContent = labels[etype] || etype;
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
    updateDNA();
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
    updateDNA();
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
    updateDNA();
  });

  // Seed
  $('btn-seed-gen').addEventListener('click', function () {
    STATE.seed = Math.floor(Math.random() * 999999);
    $('seed-in').value = STATE.seed;
    updateDNA();
    generate();
  });
  $('btn-seed-load').addEventListener('click', function () {
    const v = $('seed-in').value.trim();
    if (v.length > 10) {
      // Long strings are treated as a full map code, not a raw seed
      if (!loadMapCode(v)) toast('Invalid Code', 'Could not parse map code.');
    } else {
      STATE.seed = parseInt(v) || 0;
      $('seed-in').value = STATE.seed;
      generate();
    }
  });
  $('btn-seed-copy').addEventListener('click', function () {
    const code = buildMapCode();
    navigator.clipboard.writeText(code).then(function () {
      toast('Copied!', 'Map code copied to clipboard. Share it to reproduce this exact terrain.');
    }).catch(function () {
      $('seed-in').value = code;
      $('seed-in').select();
      toast('Select & Copy', 'Clipboard unavailable — code is selected in the input.');
    });
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
  $('btn-export-obj').addEventListener('click', exportOBJ);
  $('btn-export-glb').addEventListener('click', exportGLB);
  $('btn-export-hm16').addEventListener('click', exportHeightmap16);
  $('btn-export-splat').addEventListener('click', exportSplatmap);
  $('btn-new-proj').addEventListener('click', function () {
    runtime.currentProjectId = null;
    STATE.seed = Math.floor(Math.random() * 99999);
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

  // Erosion type selector
  document.querySelectorAll('.ero-type-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      STATE.erosionType = btn.dataset.etype;
      updateErosionTypeUI(STATE.erosionType);
    });
  });

  // Erosion-specific sliders
  const eroSliders = [
    ['sl-droplets', 'droplets', 0], ['sl-inertia', 'inertia', 2],
    ['sl-eroRate', 'eroRate', 2], ['sl-depRate', 'depRate', 2], ['sl-evap', 'evap', 3],
    ['sl-talus', 'talusAngle', 0], ['sl-thermiters', 'thermIters', 0]
  ];
  eroSliders.forEach(function (s) {
    const el = $(s[0]); if (!el) return;
    el.addEventListener('input', function () {
      STATE[s[1]] = parseFloat(el.value);
      const vEl = $('v-' + s[0].replace('sl-', ''));
      if (vEl) vEl.textContent = parseFloat(el.value).toFixed(s[2]);
    });
  });

  // Flow map toggle
  tog('tog-flowmap', 'tfm-tog', 'showFlowMap', function (v) {
    if (!v) {
      // Restore original vertex colors if flow map removed
      if (runtime.heightCache) buildTerrainMesh(runtime.heightCache);
    } else {
      if (runtime.flowMap) applyFlowMapOverlay();
    }
  });

  // Node graph init
  NG.init();

  // Keyboard
  window.addEventListener('keydown', function (e) {
    const act = document.activeElement;
    if (act === $('terrain-eq') || act === $('seed-in') || act === $('proj-name-inp')) {
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
