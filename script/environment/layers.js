// ─────────────────────────────────────────────────────────────────
// LAYERS — mathematical layers composited on top of the base
// heightmap equation (add / multiply / subtract / replace).
// ─────────────────────────────────────────────────────────────────

import { STATE } from '../core/state.js';
import { $, escH } from '../utils/utils.js';
import { getEquationFn } from '../engine/equations.js';
import { updateDNA } from '../utils/seed.js';

let layerIdCounter = 0;

export function addLayer(eq, blend, op, on) {
  eq = eq || 'fbm(x*2,y*2,4)*0.5';
  blend = blend || 'add'; op = op != null ? op : 1.0; on = on != null ? on : true;
  const id = ++layerIdCounter;
  let fn = null;
  try { fn = getEquationFn(eq); } catch (e) { /* invalid equation, leave fn null */ }
  const lay = { id, eq, blend, op, on, fn };
  STATE.layers.push(lay);

  const row = document.createElement('div');
  row.className = 'lay-row'; row.dataset.lid = id;
  row.innerHTML =
    '<span style="font-family:var(--fm);font-size:9px;color:var(--t3);min-width:18px">L' + STATE.layers.length + '</span>' +
    '<input type="checkbox" ' + (on ? 'checked' : '') + ' title="Enable layer">' +
    '<input type="text" class="leq" value="' + escH(eq) + '" placeholder="layer equation…" style="flex:1">' +
    '<select class="lblend" title="Blend mode">' +
    '<option value="add"' + (blend === 'add' ? ' selected' : '') + '>+ Add</option>' +
    '<option value="multiply"' + (blend === 'multiply' ? ' selected' : '') + '>× Mul</option>' +
    '<option value="subtract"' + (blend === 'subtract' ? ' selected' : '') + '>- Sub</option>' +
    '<option value="replace"' + (blend === 'replace' ? ' selected' : '') + '>= Rep</option>' +
    '</select>' +
    '<input type="range" class="lop" min="0" max="2" step="0.05" value="' + op + '">' +
    '<span class="svs lop-v">' + op.toFixed(2) + '</span>' +
    '<button class="btn sm er lrm" title="Remove">✕</button>';

  const eqIn = row.querySelector('.leq');
  const chk = row.querySelector('input[type=checkbox]');
  const blSel = row.querySelector('.lblend');
  const opR = row.querySelector('.lop');
  const opV = row.querySelector('.lop-v');

  eqIn.addEventListener('input', function () {
    lay.eq = eqIn.value;
    try { lay.fn = getEquationFn(eqIn.value); eqIn.style.borderColor = ''; }
    catch (e) { lay.fn = null; eqIn.style.borderColor = 'var(--er)'; }
    updateDNA();
  });
  chk.addEventListener('change', function () { lay.on = chk.checked; });
  blSel.addEventListener('change', function () { lay.blend = blSel.value; });
  opR.addEventListener('input', function () { lay.op = parseFloat(opR.value); opV.textContent = lay.op.toFixed(2); });
  row.querySelector('.lrm').addEventListener('click', function () {
    STATE.layers = STATE.layers.filter(function (l) { return l.id !== id; });
    row.remove();
    updateDNA();
    renumLayers();
  });

  $('lay-con').appendChild(row);
  updateDNA();
  renumLayers();
}

export function renumLayers() {
  const rows = $('lay-con').querySelectorAll('.lay-row');
  rows.forEach(function (r, i) {
    const sp = r.querySelector('span');
    if (sp) sp.textContent = 'L' + (i + 1);
  });
}
