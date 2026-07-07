import { STATE, runtime } from '../core/state.js';
import { $, escH, fmtDate } from './utils.js';
import { getAllMaps, getMapById, saveMapDB, deleteMapDB } from './db.js';
import { addLayer } from '../environment/layers.js';
import { generate } from '../engine/generator.js';
import { toast } from './toast.js';
import { syncAllUI } from './ui.js';


export function captureThumb() {
  try {
    const th = document.createElement('canvas'); th.width = 320; th.height = 180;
    runtime.renderer.render(runtime.scene, runtime.camera);
    th.getContext('2d').drawImage(runtime.renderer.domElement, 0, 0, 320, 180);
    return th.toDataURL('image/jpeg', 0.78);
  } catch (e) { return ''; }
}

export function captureState() {
  return JSON.parse(JSON.stringify(STATE));
}

export function restoreState(st) {
  if (!st) return;
  Object.assign(STATE, st);
  syncAllUI();
  // Restore layers
  $('lay-con').innerHTML = ''; STATE.layers = [];
  if (st.layers && st.layers.length) {
    st.layers.forEach(function (l) { addLayer(l.eq, l.blend, l.op, l.on); });
  }
  generate();
}


export function showVisualizer(name) {
  $('home-screen').style.display = 'none';
  $('viz-topbar').style.display = 'flex';
  $('terrain-stats').style.display = 'flex';
  $('terrain-ui').style.display = 'flex';
  $('utog').style.display = 'flex';
  $('proj-cur-name').textContent = name || 'Unsaved Map';
}

export function showHome() {
  $('home-screen').style.display = 'flex';
  $('viz-topbar').style.display = 'none';
  $('terrain-stats').style.display = 'none';
  $('terrain-ui').style.display = 'none';
  $('utog').style.display = 'none';
  runtime.currentProjectId = null;
  loadHomeProjects();
}

export function loadHomeProjects() {
  getAllMaps(function (maps) {
    const grid = $('proj-grid'); grid.innerHTML = '';
    $('hs-proj-count').textContent = maps.length;
    if (!maps.length) {
      grid.innerHTML = '<div class="empty-state">' +
        '<div class="empty-icon">⛰</div>' +
        '<h3>No saved maps yet</h3>' +
        '<p>Create your first terrain using the + button above.</p>' +
        '</div>';
      return;
    }
    maps.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    maps.forEach(function (m) { grid.appendChild(mkMapCard(m)); });
  });
}

function mkMapCard(proj) {
  const card = document.createElement('div'); card.className = 'proj-card';
  const eq = (proj.state && proj.state.eq) || '—';
  const eqShort = eq.length > 44 ? eq.slice(0, 42) + '…' : eq;
  const thumb = proj.thumbnail || '';
  card.innerHTML =
    '<div class="proj-thumb">' +
    (thumb ? '<img src="' + thumb + '" alt="Map preview" loading="lazy">' : '<div class="proj-thumb-placeholder">⛰</div>') +
    '<div class="proj-thumb-overlay"></div>' +
    '</div>' +
    '<div class="proj-info">' +
    '<div class="proj-name">' + escH(proj.name) + '</div>' +
    '<div class="proj-meta"><span class="proj-meta-lbl">Seed</span><span class="proj-meta-val">' + ((proj.state && proj.state.seed) || '—') + '</span></div>' +
    '<div class="proj-meta"><span class="proj-meta-lbl">Updated</span><span class="proj-meta-val">' + fmtDate(proj.updatedAt) + '</span></div>' +
    '<div class="proj-eq"><code>h = ' + escH(eqShort) + '</code></div>' +
    '</div>' +
    '<div class="proj-actions">' +
    '<button class="proj-open">▶ Open Map</button>' +
    '<button class="proj-del" title="Delete">🗑</button>' +
    '</div>';

  card.querySelector('.proj-open').addEventListener('click', function (e) {
    e.stopPropagation(); openMap(proj);
  });
  card.querySelector('.proj-del').addEventListener('click', function (e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    if (btn.dataset.confirming === '1') {
      btn.dataset.confirming = '0';
      deleteMapDB(proj.id, function () { loadHomeProjects(); });
    } else {
      btn.dataset.confirming = '1'; btn.textContent = '✓';
      btn.style.cssText = 'background:rgba(240,68,102,.32)!important;border-color:#f04466!important;color:#fff!important;';
      setTimeout(function () {
        if (btn.dataset.confirming === '1') {
          btn.dataset.confirming = '0'; btn.textContent = '🗑'; btn.style.cssText = '';
        }
      }, 2500);
    }
  });
  card.addEventListener('click', function () { openMap(proj); });
  return card;
}

function openMap(proj) {
  runtime.currentProjectId = proj.id;
  showVisualizer(proj.name);
  restoreState(proj.state);
}


export function showSaveModal() {
  const inp = $('proj-name-inp');
  inp.value = $('proj-cur-name').textContent === 'Unsaved Map' ? '' : $('proj-cur-name').textContent;
  $('save-modal').classList.add('open');
  setTimeout(function () { inp.focus(); inp.select(); }, 60);
}

export function hideSaveModal() {
  $('save-modal').classList.remove('open');
}

export function doSave() {
  const name = $('proj-name-inp').value.trim() || 'Untitled Map';
  const now = Date.now();
  const state = captureState();
  const thumb = captureThumb();
  hideSaveModal();

  function performSave(createdAt) {
    const proj = { name, createdAt, updatedAt: now, state, thumbnail: thumb };
    if (runtime.currentProjectId) proj.id = runtime.currentProjectId;
    saveMapDB(proj, function (id) {
      runtime.currentProjectId = id;
      $('proj-cur-name').textContent = name;
      toast('✓ Saved', '"' + escH(name) + '" saved to library.');
    });
  }

  if (runtime.currentProjectId) {
    getMapById(runtime.currentProjectId, function (ex) { performSave(ex ? ex.createdAt : now); });
  } else {
    performSave(now);
  }
}
