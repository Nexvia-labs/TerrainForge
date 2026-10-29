// ============================================================
// TerrainForge Pro — scene-setup.js
// THREE.js renderer/camera/scene/lighting-rig setup (initThree) and sky/shadow helpers.
// Classic script (shares global scope with every other module —
// see index.html for required load order).
// ============================================================

var renderer, camera, scene;
var sunLight, hemiLight, fillLight; // lighting rig — set up in initThree()
var SUN_DIR = new THREE.Vector3(1,0,0); // set for real in initThree() via updateSunDirectionFromAngles()

// Recomputes SUN_DIR from STATE.sunElevation/STATE.sunAzimuth (the
// Shaders/Graphics tab) and re-fits the sun light + its shadow frustum to
// match. Elevation is degrees above the horizon (90 = straight up);
// azimuth is compass degrees in the XZ plane, measured from +Z toward +X
// (0°→+Z, 90°→+X). Called on every Graphics-tab slider move
// (bindGraphicsControls() in ui-bindings.js) and once at startup.
function updateSunDirectionFromAngles(){
  var er = STATE.sunElevation*Math.PI/180, ar = STATE.sunAzimuth*Math.PI/180;
  var y = Math.sin(er), h = Math.cos(er);
  SUN_DIR.set(h*Math.sin(ar), y, h*Math.cos(ar)).normalize();
  var meshScale = (STATE.scale||1.0)*(STATE.mapArea||1.0);
  updateSunShadowFrustum(SURF*meshScale);
}

// Re-fits the sun's position + orthographic shadow frustum to the
// current terrain's world-space footprint. Called once at startup and
// again every time buildTerrainMesh() knows the real map size, since
// the Scale/Map Area sliders can change it by more than 100×.
function updateSunShadowFrustum(worldSize){
  if(!sunLight) return;
  var dist = worldSize*1.2 + 40;
  sunLight.position.copy(SUN_DIR).multiplyScalar(dist);
  sunLight.target.position.set(0,0,0);
  var r = Math.max(10, worldSize*0.75);
  var cam = sunLight.shadow.camera;
  cam.left=-r; cam.right=r; cam.top=r; cam.bottom=-r;
  cam.near = Math.max(1, dist-worldSize*2-60);
  cam.far  = dist+worldSize*2+60;
  cam.updateProjectionMatrix();
}

// Small vertical-gradient backdrop (a couple of texels wide, 256 tall)
// standing in for a sky/void behind the terrain. Kept in the same dark,
// moody navy family as the app's original flat background colour —
// just with an actual gradient instead of one flat tone, so there's a
// sense of depth behind the model instead of a solid wall of colour.
function makeSkyGradientTexture(topHex, bottomHex){
  var cv=document.createElement('canvas');
  cv.width=4; cv.height=256;
  var ctx=cv.getContext('2d');
  var grad=ctx.createLinearGradient(0,0,0,256);
  grad.addColorStop(0, topHex);
  grad.addColorStop(1, bottomHex);
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,4,256);
  var tex=new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  tex.needsUpdate=true;
  return tex;
}

function initThree(){
  renderer = new THREE.WebGLRenderer({antialias:false, preserveDrawingBuffer:true, alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1));
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.zIndex='1';

  camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 20000);
  applyCam();

  scene = new THREE.Scene();
  scene.background = makeSkyGradientTexture('#080e1e','#1c2c4a');
  // Fog colour is intentionally left as raw sRGB hex (not linearized):
  // three.js blends fog in *after* tone-mapping/encoding, at the very
  // end of the pipeline, so it wants the same "as authored" convention
  // you'd hand a CSS color, not a linear-light scene colour.
  scene.fog = new THREE.FogExp2(0x1c2c4a, 0.0018);

  // ── LIGHTING RIG — hemisphere ambient + shadow-casting sun + fill ──
  // Hemisphere light replaces the old flat AmbientLight: upward-facing
  // ground now reads a cool sky tint while undersides/crevices read a
  // warm ground-bounce tint, instead of one flat colour everywhere.
  hemiLight = new THREE.HemisphereLight(0x3f5a78, 0x2a2018, 0.9);
  hemiLight.color.convertSRGBToLinear();
  hemiLight.groundColor.convertSRGBToLinear();
  scene.add(hemiLight);

  // Key light — the sun. Now actually casts shadows, so ridgelines
  // fall across the valleys behind them instead of every slope reading
  // equally lit no matter what's blocking the light.
  sunLight = new THREE.DirectionalLight(0xfff2d8, 2.8);
  sunLight.color.convertSRGBToLinear();
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048,2048);
  sunLight.shadow.bias = -0.0012;
  sunLight.shadow.normalBias = 0.4;
  scene.add(sunLight);
  scene.add(sunLight.target);
  updateSunDirectionFromAngles(); // sets SUN_DIR from STATE and fits the shadow frustum (re-fitted properly once a terrain exists)

  // Fill/bounce light — cool and subtle now that the hemisphere light
  // supplies most of the ambient, so shadowed slopes stay readable
  // without washing the shadows out.
  fillLight = new THREE.DirectionalLight(0x4488cc, 0.22);
  fillLight.color.convertSRGBToLinear();
  fillLight.position.set(-12,8,-20);
  scene.add(fillLight);

  mkGrp = new THREE.Group(); scene.add(mkGrp);

  // Orbit + Pan controls
  var el = renderer.domElement;

  el.addEventListener('mousedown',function(e){
    if(fpp.active) return;
    // ── PLACEMENT MODE: left-click starts terrain drag ───────────
    if(placementMode.active && e.button===0){
      placementMode.dragging=true;
      document.body.classList.add('placement-drag');
      movePlacedTerrain(e.clientX, e.clientY);
      e.preventDefault();
      return;
    }
    if(e.button===2){
      // Right-click = pan
      orb.panning=true; _mx=e.clientX; _my=e.clientY;
      e.preventDefault();
    } else {
      // Left-click = orbit
      orb.dragging=true; orb.autoRotate=false;
      _mx=e.clientX; _my=e.clientY;
      tcTogOff();
    }
  });
  el.addEventListener('contextmenu',function(e){ e.preventDefault(); });

  window.addEventListener('mouseup',function(e){
    if(placementMode.active && placementMode.dragging){
      placementMode.dragging=false;
      document.body.classList.remove('placement-drag');
      return;
    }
    orb.dragging=false; orb.panning=false;
    if(ANIM.recording && _animOpen) animAddKF();
  });
  window.addEventListener('mousemove',function(e){
    if(fpp.active) return;
    // ── PLACEMENT MODE: drag moves the terrain ──────────────────
    if(placementMode.active && placementMode.dragging){
      movePlacedTerrain(e.clientX, e.clientY);
      return;
    }
    if(orb.panning){
      doPan(e.clientX-_mx, e.clientY-_my);
      _mx=e.clientX; _my=e.clientY; return;
    }
    if(!orb.dragging) return;
    orb.theta -= (e.clientX-_mx)*.007;
    orb.phi = Math.max(.15,Math.min(1.45,orb.phi+(e.clientY-_my)*.005));
    _mx=e.clientX; _my=e.clientY; applyCam();
  });

  // Touch: 1-finger orbit, 2-finger pinch+pan
  el.addEventListener('touchstart',function(e){
    // ── PLACEMENT MODE: single touch drags the terrain ──────────
    if(placementMode.active && e.touches.length===1){
      placementMode.dragging=true;
      movePlacedTerrain(e.touches[0].clientX, e.touches[0].clientY);
      return;
    }
    if(e.touches.length===2){
      orb._pinchDist = Math.hypot(
        e.touches[0].clientX-e.touches[1].clientX,
        e.touches[0].clientY-e.touches[1].clientY);
      orb._pinchRadius = orb.targetRadius;
      orb._pinchMidX = (e.touches[0].clientX+e.touches[1].clientX)*0.5;
      orb._pinchMidY = (e.touches[0].clientY+e.touches[1].clientY)*0.5;
    } else {
      orb.dragging=true; orb.autoRotate=false; tcTogOff();
      _bx=e.touches[0].clientX; _by=e.touches[0].clientY;
    }
  },{passive:true});
  window.addEventListener('touchend',function(e){
    if(placementMode.active){ placementMode.dragging=false; return; }
    if(e.touches.length<2){ orb._pinchDist=null; orb._pinchMidX=null; }
    orb.dragging=false;
  });
  window.addEventListener('touchmove',function(e){
    // ── PLACEMENT MODE ───────────────────────────────────────────
    if(placementMode.active && placementMode.dragging && e.touches.length===1){
      movePlacedTerrain(e.touches[0].clientX, e.touches[0].clientY);
      return;
    }
    if(e.touches.length===2 && orb._pinchDist!=null){
      var d=Math.hypot(
        e.touches[0].clientX-e.touches[1].clientX,
        e.touches[0].clientY-e.touches[1].clientY);
      // Pinch zoom
      var scale=orb._pinchDist/d;
      orb.targetRadius=Math.max(8,Math.min(maxCamRadius(),orb._pinchRadius*scale));
      updateZoomLevel();
      // Two-finger pan (midpoint drag)
      var mx=(e.touches[0].clientX+e.touches[1].clientX)*0.5;
      var my=(e.touches[0].clientY+e.touches[1].clientY)*0.5;
      if(orb._pinchMidX!=null){
        doPan(mx-orb._pinchMidX, my-orb._pinchMidY);
      }
      orb._pinchMidX=mx; orb._pinchMidY=my;
      return;
    }
    if(!orb.dragging) return;
    orb.theta -= (e.touches[0].clientX-_bx)*.007;
    orb.phi = Math.max(.15,Math.min(1.45,orb.phi+(e.touches[0].clientY-_by)*.005));
    _bx=e.touches[0].clientX; _by=e.touches[0].clientY; applyCam();
  },{passive:true});

  el.addEventListener('wheel',function(e){
    if(fpp.active) return;
    orb.targetRadius=Math.max(8,Math.min(maxCamRadius(), orb.targetRadius+e.deltaY*0.06));
    updateZoomLevel();
  },{passive:true});

  window.addEventListener('resize',function(){
    camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  });
}
