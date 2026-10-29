// ============================================================
// TerrainForge Pro — water-equation.js
// Custom water-motion equation compiler and its UI bindings (Water tab equation bar).
// Also compiles the "battle mode" second equation (waterEq2Fn) and binds
// the water engine's Wave-Lab-parity controls: feedback, battle mode,
// spatial/phase/damp, biharmonic viscosity, and layer coloring — the
// same parameter groups as js/water/wave-lab.js, wired to STATE instead
// of WS and to the real ocean surface (see animateWater() in water.js).
// Classic script (shares global scope with every other module —
// see index.html for required load order).
// ============================================================

var waterEqFn = null, waterEq2Fn = null;
var waterEqPrevBuf = null, waterEqBuf = null;
var waterEqGridN = 0, waterEqCellSize = 1;

// ── PLACEMENT MODE STATE (Blender-style interactive import) ──────
function buildWaterEqFn(eq) {
  try {
    var fn = new Function(
      'x','y','t','d','prev','noise3','warpX','warpY',
      'sin','cos','tan','abs','sqrt','pow','floor','ceil','round','max','min','log','exp','PI',
      'fbm','ridge','noise','dist','warp',
      'return (' + eq + ');'
    );
    return function(x, y, t) {
      try {
        var d = Math.sqrt(x*x + y*y);
        var prevFn = function(px, py) {
          if(!waterEqPrevBuf) return 0;
          var GRIDW = waterEqGridN, cs = waterEqCellSize || 1, half = (GRIDW-1)*0.5;
          var ci = Math.round(px/cs + half);
          var ri = Math.round(py/cs + half);
          ci = Math.max(0,Math.min(GRIDW-1,ci));
          ri = Math.max(0,Math.min(GRIDW-1,ri));
          return waterEqPrevBuf[ri*GRIDW + ci] || 0;
        };
        var n3fn = function(a,b,tt){ return sn(a+Math.sin(tt)*.6, b+Math.cos(tt)*.6)*.7 + sn(a-tt*.4, b+tt*.35)*.3; };
        var v = fn(x,y,t,d,prevFn,n3fn,
          function(a,b,ss){ return a+Math.sin(b*(ss||1))*.8; },
          function(a,b,ss){ return b+Math.cos(a*(ss||1))*.8; },
          Math.sin,Math.cos,Math.tan,Math.abs,Math.sqrt,Math.pow,
          Math.floor,Math.ceil,Math.round,Math.max,Math.min,Math.log,Math.exp,Math.PI,
          function(a,b,o,r){ return fbmN(a,b,o,r); },
          function(a,b){ return ridgeN(a,b); },
          function(a,b){ return sn(a,b); },
          function(a,b,cx,cy){ return Math.sqrt(Math.pow(a-(cx||0),2)+Math.pow(b-(cy||0),2)); },
          function(a,b,ss){ return domWarp(a,b,ss||0.8); }
        );
        return isFinite(v) ? v : 0;
      } catch(e) { return 0; }
    };
  } catch(e) { return null; }
}

function waterEqCompile() {
  var fn = buildWaterEqFn(STATE.waterEq);
  var el = document.getElementById('water-eq');
  if(fn){ waterEqFn = fn; if(el) el.classList.remove('err'); }
  else if(el){ el.classList.add('err'); } // keep the last working fn running; just flag the typo

  // Battle mode — second equation, summed into the first each frame
  // (mirrors WS.battleMode / WS._eq2Fn in wave-lab.js). Only compiled
  // while battle mode is on; otherwise left null so animateWater() skips it.
  var el2 = document.getElementById('water-eq2');
  if (STATE.waterBattleMode) {
    var fn2 = buildWaterEqFn(STATE.waterEq2);
    if(fn2){ waterEq2Fn = fn2; if(el2) el2.classList.remove('err'); }
    else if(el2){ el2.classList.add('err'); } // keep the last working fn2; just flag the typo
  } else {
    waterEq2Fn = null;
    if(el2) el2.classList.remove('err');
  }
}

// ── Ripple contribution ───────────────────────────────────────────
function bindWaterEqControls() {
  var eqEl = document.getElementById('water-eq');
  var eq2El = document.getElementById('water-eq2');
  var presetSel = document.getElementById('water-eq-preset');
  var togEl = document.getElementById('tog-water-eq'), pillEl = document.getElementById('tweq-tog');

  function setActive(on){
    STATE.waterEqOn = on;
    if(pillEl) pillEl.classList.toggle('on', on);
    if(eqEl) eqEl.disabled = !on;
    if(eq2El) eq2El.disabled = !on;
  }

  if(togEl){ togEl.addEventListener('click', function(){ setActive(!STATE.waterEqOn); }); }
  setActive(STATE.waterEqOn); // reflect current (default: off) state in the UI

  if(eqEl){
    eqEl.addEventListener('input', function(){ STATE.waterEq = eqEl.value.trim() || STATE.waterEq; waterEqCompile(); });
    eqEl.addEventListener('keydown', function(e){ if(e.key==='Enter'){ waterEqCompile(); eqEl.blur(); } });
  }
  if(eq2El){
    eq2El.addEventListener('input', function(){ STATE.waterEq2 = eq2El.value.trim() || STATE.waterEq2; waterEqCompile(); });
    eq2El.addEventListener('keydown', function(e){ if(e.key==='Enter'){ waterEqCompile(); eq2El.blur(); } });
  }

  if(presetSel){
    presetSel.addEventListener('change', function(){
      if(!presetSel.value) return;
      if(eqEl) eqEl.value = presetSel.value;
      STATE.waterEq = presetSel.value;
      waterEqCompile();
      setActive(true); // picking a preset is an unambiguous "use this"
      presetSel.value = '';
    });
  }

  // Feedback toggle — prev(x,y) reads back last frame's (post-smoothing)
  // field only while this is on; mirrors WS.feedbackEnabled in wave-lab.js.
  var togFb = document.getElementById('tog-water-fb'), pillFb = document.getElementById('twfb-tog');
  if(togFb){
    togFb.addEventListener('click', function(){
      STATE.waterFeedbackEnabled = !STATE.waterFeedbackEnabled;
      if(pillFb) pillFb.classList.toggle('on', STATE.waterFeedbackEnabled);
      if(!STATE.waterFeedbackEnabled && waterEqPrevBuf) waterEqPrevBuf.fill(0);
    });
    if(pillFb) pillFb.classList.toggle('on', STATE.waterFeedbackEnabled);
  }

  // Battle mode — second equation (water-eq2), summed into the first
  // each frame; mirrors WS.battleMode / the wl-battle-row in wave-lab.js.
  var togBat = document.getElementById('tog-water-battle'), pillBat = document.getElementById('twbat-tog');
  var battleRowEl = document.getElementById('water-battle-row');
  if(togBat){
    togBat.addEventListener('click', function(){
      STATE.waterBattleMode = !STATE.waterBattleMode;
      if(pillBat) pillBat.classList.toggle('on', STATE.waterBattleMode);
      if(battleRowEl) battleRowEl.classList.toggle('show', STATE.waterBattleMode);
      waterEqCompile();
    });
    if(pillBat) pillBat.classList.toggle('on', STATE.waterBattleMode);
    if(battleRowEl) battleRowEl.classList.toggle('show', STATE.waterBattleMode);
  }

  waterEqCompile(); // compile the default/current equation (+ eq2 if battle mode is on) once up front
}

// ── Bind water advanced controls: spatial/phase/damp, biharmonic
// viscosity, and the layer-coloring palette — mirrors bindWaveLabControls()
// in wave-lab.js, wired to STATE.water* and the real ocean surface instead
// of WS and the Wave Lab's own analytical mesh.
function bindWaterAdvancedControls() {
  var wSliders = [
    ['sl-water-freq','waterSpatialFreq',2,'v-water-freq'],
    ['sl-water-phase','waterPhase',2,'v-water-phase'],
    ['sl-water-damp','waterDamp',2,'v-water-damp'],
    ['sl-water-visc','waterViscosity',3,'v-water-visc'],
    ['sl-water-hvisc','waterHyperViscosity',3,'v-water-hvisc']
  ];
  wSliders.forEach(function(row){
    var el = document.getElementById(row[0]); if(!el) return;
    el.addEventListener('input', function(){
      STATE[row[1]] = parseFloat(el.value);
      var vEl = document.getElementById(row[3]);
      if(vEl) vEl.textContent = parseFloat(el.value).toFixed(row[2]);
    });
  });

  // Color palette buttons — "Realistic" (off) plus the same six Wave Lab
  // palettes; the actual per-pixel math lives in waterColorMap() (water.js),
  // a direct copy of wsColorMap()'s cases (wave-lab.js).
  document.querySelectorAll('.w-pal-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      STATE.waterColorMode = btn.dataset.wpal;
      document.querySelectorAll('.w-pal-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var cc = document.getElementById('water-custom-colors');
      if(cc) cc.style.display = STATE.waterColorMode === 'custom' ? 'flex' : 'none';
      if(typeof applyWaterColorMode === 'function') applyWaterColorMode();
    });
  });

  // Custom color pickers (Lo/Mid/Hi)
  ['lo','mid','hi'].forEach(function(key,ki){
    var el = document.getElementById('water-col-'+key); if(!el) return;
    el.addEventListener('input', function(){
      var rgb = hex2rgb(el.value);
      if(ki===0) STATE.waterCustomLow = rgb; else if(ki===1) STATE.waterCustomMid = rgb; else STATE.waterCustomHigh = rgb;
    });
  });
}

// ── CLIMATE BIOME + TREE LOD CONTROLS ─────────────────────────────
