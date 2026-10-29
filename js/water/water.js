// ============================================================
// TerrainForge Pro — water.js
// The ocean water plane: material, mesh construction, and per-frame animation (animateWater).
// animateWater() also carries the water engine's Wave-Lab-parity features:
// spatial/phase/damp shaping, the shared applyHyperSmoothing() biharmonic
// PDE pass (ν∇²u − μ∇⁴u, defined in wave-lab.js and already shared with
// the Chaos Engine), battle-mode dual equations, prev(x,y) feedback, and
// waterColorMap() layer coloring — the same logic as the Wave Lab's
// WS system (wave-lab.js), applied to this real ocean surface via STATE.
// Classic script (shares global scope with every other module —
// see index.html for required load order).
// ============================================================

var importedWaterMeshes=[]; // per-import water planes (imports from other saved maps)
var waterSmoothBuf = null;  // scratch buffer for applyHyperSmoothing() — sized/reset in buildWater()
var _waterColorObj = null;  // cached THREE.Color for waterColorMap(), avoids per-vertex allocation

// ── Custom water equation runtime ──────────────────────────────────
// waterEqFn/waterEq2Fn: compiled z(x,y,t) functions driving animateWater()
// when STATE.waterEqOn (and STATE.waterBattleMode) are true.
// waterEqPrevBuf backs the prev(x,y) feedback term. waterEqBuf holds this
// frame's raw field (custom-equation OR built-in — whichever path ran) for
// EVERY vertex, indexed to match the water mesh's own vertex grid
// (rebuilt alongside it in buildWater()); it feeds the biharmonic
// smoothing pass, the feedback buffer, and the layer-coloring normalization.
function createWaterMaterial(deepRGB, shallowRGB, opacity){
  var mixRGB=[
    deepRGB[0]*0.35+shallowRGB[0]*0.65,
    deepRGB[1]*0.35+shallowRGB[1]*0.65,
    deepRGB[2]*0.35+shallowRGB[2]*0.65
  ];
  var col=new THREE.Color(mixRGB[0],mixRGB[1],mixRGB[2]);
  col.convertSRGBToLinear();
  return new THREE.MeshPhysicalMaterial({
    color:col,
    transparent:true,
    opacity:opacity,
    roughness:1-STATE.waterReflectivity, // Shaders/Graphics tab — see bindGraphicsControls() in ui-bindings.js
    metalness:0.0,
    clearcoat:1.0,
    clearcoatRoughness:0.04,
    side:THREE.DoubleSide
  });
}

// ── Water color map — same palette system as the Wave Lab's wsColorMap()
// (wave-lab.js): spectrum/fire/ice/plasma/neon gradients plus a 3-stop
// custom gradient, all keyed off STATE instead of WS. 'off' is handled by
// the caller (animateWater skips calling this entirely in that mode), so
// every case here matches wsColorMap()'s math one-for-one.
function waterColorMap(n) {
  var h = Math.max(0, Math.min(1, n));
  if(!_waterColorObj) _waterColorObj = new THREE.Color();
  var c = _waterColorObj;
  var mode = STATE.waterColorMode;
  switch(mode) {
    case 'fire':
      if(h<.25){c.setRGB(h*4*.9, h*4*.04, 0);}
      else if(h<.5){var p=(h-.25)*4; c.setRGB(.9+p*.1, p*.65, 0);}
      else if(h<.75){var p=(h-.5)*4;  c.setRGB(1, .65+p*.3, p*.25);}
      else{var p=(h-.75)*4; c.setRGB(1, .95+p*.05, .25+p*.75);} break;
    case 'ice':
      if(h<.3){c.setHSL(.585,.85,h*.35);}
      else if(h<.7){var p=(h-.3)/.4; c.setHSL(.565+p*.04,.7+p*.3,.1+p*.52);}
      else{var p=(h-.7)/.3; c.setHSL(.52+p*.03,.4,.62+p*.35);} break;
    case 'plasma':
      var hue=.72+h*.28; if(hue>1)hue-=1;
      c.setHSL(hue,.92,.18+h*.62); break;
    case 'neon':
      if(h<.45){c.setHSL(.37,.9,.04+h*.56);}
      else{var p=(h-.45)/.55; c.setHSL(.52+p*.07,.95,.29+p*.5);} break;
    case 'custom':
      var lo=STATE.waterCustomLow, mi=STATE.waterCustomMid, hi=STATE.waterCustomHigh, r,g,b;
      if(h<.5){var p=h*2; r=lo[0]+(mi[0]-lo[0])*p; g=lo[1]+(mi[1]-lo[1])*p; b=lo[2]+(mi[2]-lo[2])*p;}
      else{var p=(h-.5)*2; r=mi[0]+(hi[0]-mi[0])*p; g=mi[1]+(hi[1]-mi[1])*p; b=mi[2]+(hi[2]-mi[2])*p;}
      c.setRGB(Math.max(0,Math.min(1,r)),Math.max(0,Math.min(1,g)),Math.max(0,Math.min(1,b))); break;
    default: // spectrum
      var hue,lgt;
      if(h<.3){hue=.62;lgt=.26+h*.58;}
      else if(h<.5){hue=.56;lgt=.44+(h-.3)*.38;}
      else if(h<.7){hue=.79;lgt=.52+(h-.5)*.33;}
      else{hue=.93;lgt=.59+(h-.7)*.28;}
      c.setHSL(hue,.88,Math.min(.82,lgt));
  }
  return c;
}

// The material's base "deep/shallow" tint (same mix createWaterMaterial()
// computes), used to restore realistic coloring when layer coloring is off.
function mainWaterBaseColor(){
  var deepRGB=hex2rgb(STATE.colors.deep), shallowRGB=hex2rgb(STATE.colors.shallow);
  var mixRGB=[
    deepRGB[0]*0.35+shallowRGB[0]*0.65,
    deepRGB[1]*0.35+shallowRGB[1]*0.65,
    deepRGB[2]*0.35+shallowRGB[2]*0.65
  ];
  var col=new THREE.Color(mixRGB[0],mixRGB[1],mixRGB[2]);
  col.convertSRGBToLinear();
  return col;
}

// Toggle the water material between its realistic deep/shallow tint and
// per-vertex layer coloring. Vertex colors multiply material.color in
// three.js, so layer-coloring mode sets it to white to show the palette
// unmodified; turning it off restores the normal water tint.
function applyWaterColorMode(){
  if(!waterMesh) return;
  var on = !!(STATE.waterColorMode && STATE.waterColorMode!=='off');
  waterMesh.material.vertexColors = on;
  waterMesh.material.color.copy(on ? new THREE.Color(1,1,1) : mainWaterBaseColor());
  waterMesh.material.needsUpdate = true;
}

// ── WATER PLANE ──────────────────────────────────────────────────
function buildWater(){
  if(waterMesh){scene.remove(waterMesh);waterMesh.geometry.dispose();waterMesh.material.dispose();}
  var meshScale=(STATE.scale||1.0)*(STATE.mapArea||1.0);
  var segs=48, planeSize=SURF*1.5*meshScale;
  var geo=new THREE.PlaneGeometry(planeSize,planeSize,segs,segs);
  geo.rotateX(-Math.PI/2);
  // Per-vertex color buffer — populated by waterColorMap() in animateWater()
  // whenever STATE.waterColorMode isn't 'off' (see applyWaterColorMode()).
  var vCount=geo.attributes.position.count;
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(vCount*3), 3));
  var mat=createWaterMaterial(hex2rgb(STATE.colors.deep), hex2rgb(STATE.colors.shallow), STATE.wAlpha);
  waterMesh=new THREE.Mesh(geo,mat);
  waterMesh.position.y=STATE.seaLevel;
  waterMesh.receiveShadow=true;
  scene.add(waterMesh);
  // Custom water-equation prev(x,y) feedback buffers, matched to this
  // mesh's own vertex grid (PlaneGeometry lays vertices row-major, x
  // fastest, so a simple ci+ri*GRID index lines up with animateWater()).
  waterEqGridN=segs+1;
  waterEqCellSize=planeSize/segs;
  var weVC=waterEqGridN*waterEqGridN;
  waterEqPrevBuf=new Float32Array(weVC);
  waterEqBuf=new Float32Array(weVC);
  waterSmoothBuf=new Float32Array(weVC);
  applyWaterColorMode(); // sync material.vertexColors/color to the current palette choice
}

// Per-import water planes — each imported zone keeps its own original
// sea level, water tint and transparency, exactly as it looked in the
// map it was imported from (independent of this map's global water).
function buildImportedWater(){
  importedWaterMeshes.forEach(function(m){
    scene.remove(m); m.geometry.dispose(); m.material.dispose();
  });
  importedWaterMeshes=[];
  if(!STATE.importedTerrains || !STATE.importedTerrains.length) return;
  var scl=(STATE.scale||1.0), mapArea=(STATE.mapArea||1.0);
  var halfWorld=(SURF/2)*scl*mapArea;
  STATE.importedTerrains.forEach(function(zone){
    if(!zone.on) return;
    var zx=(zone.x||0)*halfWorld, zy=(zone.y||0)*halfWorld;
    var size=zone.worldSize*(zone.impScale||1.0)*(zone.impMapArea||1.0);
    if(!(size>0)) return;
    var geo=new THREE.PlaneGeometry(size,size,16,16);
    geo.rotateX(-Math.PI/2);
    var shallowRGB=hex2rgb(zone.waterColor||'#3d8fd4');
    // Imported zones only store one water colour — derive a plausible
    // darker/cooler "deep" tone from it to blend toward.
    var deepRGB=[shallowRGB[0]*0.4, shallowRGB[1]*0.45, shallowRGB[2]*0.55];
    var mat=createWaterMaterial(deepRGB, shallowRGB, zone.waterAlpha!=null?zone.waterAlpha:0.6);
    var mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(zx, zone.seaLevel||0, zy);
    mesh.receiveShadow=true;
    scene.add(mesh);
    importedWaterMeshes.push(mesh);
  });
}

// ── FOLIAGE SPAWNING ─────────────────────────────────────────────
function animateWater(t){
  if(!waterMesh) return;
  var pos = waterMesh.geometry.attributes.position;
  var arr = pos.array;
  var wh = STATE.wHeight, ws = STATE.wSpeed;
  var count = pos.count;
  // Custom equation replaces the built-in interference field below when
  // enabled. Both paths now share the Wave Lab's parameter set — spatial
  // frequency scales x/z, phase offsets time, damp is a radial falloff —
  // see STATE.waterSpatialFreq/waterPhase/waterDamp, and WS.spatialFreq/
  // WS.phase/WS.damp in wave-lab.js for the logic these are copied from.
  var useCustomEq = STATE.waterEqOn && waterEqFn;
  var useBattle = useCustomEq && STATE.waterBattleMode && waterEq2Fn;
  var sf = STATE.waterSpatialFreq||1, dmp = STATE.waterDamp||0;
  var tEff = t*ws + (STATE.waterPhase||0);

  // Traveling wave components: {kx, kz, omega, amp, phase}
  // Irrational omega ratios prevent strict periodicity → quasiperiodic field
  var W = [
    { kx: 0.380,  kz:  0.220, om: 1.000, a: 1.00, p: 0.000 },
    { kx:-0.280,  kz:  0.350, om: 1.309, a: 0.62, p: 1.732 },
    { kx: 0.180,  kz:-0.400,  om: 0.873, a: 0.52, p: 3.141 },
    { kx: 0.460,  kz:  0.140, om: 1.618, a: 0.36, p: 0.900 },
    { kx:-0.105,  kz:-0.315,  om: 0.707, a: 0.28, p: 4.800 }
  ];

  // Chaos coupling — sample live wave field into water surface
  var chaosActive = CHAOS.enabled && CHAOS._waveBuf && heightCache;
  var cEnergy = chaosActive ? Math.min(1.4, CHAOS.peakEnergy * 2.8) : 0;
  var CGRID = chaosActive ? heightCache.GRID : 0;
  var cs    = chaosActive ? heightCache.s : 1;
  var waterHalf = SURF * 0.75; // water mesh is SURF*1.5 wide

  // Pass 1 — evaluate the field (custom eq or built-in) into waterEqBuf,
  // tracking min/max as we go for the layer-coloring normalization below.
  var wMin=Infinity, wMax=-Infinity;

  for (var i = 0; i < count; i++) {
    var x = arr[i*3], z = arr[i*3+2];
    var wx = x*sf, wz = z*sf;
    var h = 0;

    if (useCustomEq) {
      // ── User equation replaces the built-in interference field ──
      h = waterEqFn(wx, wz, tEff);
      if (useBattle) h += waterEq2Fn(wx, wz, tEff); // battle mode — second equation summed in
    } else {
      // ── 1. Linear superposition of five traveling waves ─────────
      for (var w = 0; w < W.length; w++) {
        var wv = W[w];
        h += wv.a * Math.sin(wv.kx*wx*ws + wv.kz*wz*ws + wv.om*tEff + wv.p);
      }

      // ── 2. Nonlinear Stokes steepening (2nd-order correction) ───
      // Dominant wave's 2nd harmonic amplifies crests, flattens troughs
      var ph0 = W[0].kx*wx*ws + W[0].kz*wz*ws + W[0].om*tEff;
      h += 0.13 * Math.sin(2*ph0);

      // ── 3. Wave–wave interaction (energy focusing) ──────────────
      // When two wave crests coincide the product is ~+1 (rogue focus)
      var ph1 = W[1].kx*wx*ws + W[1].kz*wz*ws + W[1].om*tEff + W[1].p;
      var ph2 = W[3].kx*wx*ws + W[3].kz*wz*ws + W[3].om*tEff + W[3].p;
      var focus = Math.sin(ph0) * Math.sin(ph1);        // ±1 at coincidence
      h += 0.20 * focus * focus * Math.sign(focus);     // sharp focusing peak
      // Cross-wave resonance between waves 1 and 3
      h += 0.08 * Math.sin(ph1 + ph2) * Math.cos(ph0 - ph2);
    }

    // Radial damping envelope on the core field — same shape as the Wave
    // Lab's WS.damp, applied before the chaos/event additions below (they
    // decay on their own terms, same reasoning as ripples in wave-lab.js).
    if (dmp > 0.0005) h *= Math.exp(-Math.sqrt(wx*wx+wz*wz)*dmp);

    // ── 4. Chaos Engine coupling ─────────────────────────────────
    // Live erosion wave-field leaks into water surface → water looks
    // rougher near actively eroding zones
    if (chaosActive && cEnergy > 0.01) {
      var ci = Math.min(CGRID-1, Math.max(0, Math.round((x + waterHalf) / cs)));
      var ri = Math.min(CGRID-1, Math.max(0, Math.round((z + waterHalf) / cs)));
      var cw = CHAOS._waveBuf[ri*CGRID + ci];
      h += cw * cEnergy * 0.42;
    }

    // ── 5. Chaos Event field contributions ──────────────────────
    for (var ei = 0; ei < CHAOS_EVENTS.length; ei++) {
      h += evalChaosEventWater(CHAOS_EVENTS[ei], x, z, t);
    }

    if (!isFinite(h)) h = 0;
    waterEqBuf[i] = h;
    if (h<wMin) wMin=h; if (h>wMax) wMax=h;
  }

  // ── Extreme-smooth PDE pass: real ν∇²u − μ∇⁴u on the evaluated field ──
  // Same shared operator the Wave Lab and Chaos Engine use — see
  // applyHyperSmoothing() in wave-lab.js. A complete no-op at the default
  // 0/0, so the built-in field's look is unchanged until raised.
  var visc = STATE.waterViscosity||0, hvisc = STATE.waterHyperViscosity||0;
  if (visc>0 || hvisc>0) {
    applyHyperSmoothing(waterEqBuf, waterSmoothBuf, waterEqGridN, visc, hvisc);
    // Recompute min/max after smoothing — smoothing changes the values,
    // so layer coloring needs to match what's actually rendered.
    wMin=Infinity; wMax=-Infinity;
    for (var k=0;k<count;k++){ var v=waterEqBuf[k]; if(v<wMin)wMin=v; if(v>wMax)wMax=v; }
  }

  // Feed this frame's (post-smoothing) field back in as next frame's
  // prev(x,y) — only while Feedback is on, same as Wave Lab's WS._prevBuf.
  if (useCustomEq && STATE.waterFeedbackEnabled && waterEqPrevBuf) waterEqPrevBuf.set(waterEqBuf);

  // ── Pass 2 — write vertex height, plus optional layer coloring ──────
  var hoff = STATE.waterHeightOffset||0;
  var colorOn = STATE.waterColorMode && STATE.waterColorMode!=='off';
  var colArr = colorOn ? waterMesh.geometry.attributes.color.array : null;
  var wRng = colorOn ? ((wMax-wMin)||1) : 1;
  for (var j = 0; j < count; j++) {
    var hv = waterEqBuf[j];
    arr[j*3+1] = STATE.seaLevel + hoff + hv*wh;
    if (colorOn) {
      var n = (hv-wMin)/wRng;
      var c = waterColorMap(n);
      colArr[j*3]=c.r; colArr[j*3+1]=c.g; colArr[j*3+2]=c.b;
    }
  }
  if (colorOn) waterMesh.geometry.attributes.color.needsUpdate = true;

  pos.needsUpdate = true;
  // Waves displaced the vertices above but normals were never recomputed,
  // so the surface used to shade as if perfectly flat no matter how much
  // it moved. Recomputing here is what lets the sun's specular highlight
  // actually sparkle across the wave crests as they shift, instead of
  // sitting frozen in one spot.
  waterMesh.geometry.computeVertexNormals();
  waterMesh.geometry.attributes.normal.needsUpdate = true;
}

// ── STATS ────────────────────────────────────────────────────────
