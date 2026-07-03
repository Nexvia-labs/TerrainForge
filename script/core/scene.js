import { runtime } from './script/core/state.js';
import { $ } from './script/utils/utils.js';

export function initThree() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.zIndex = '1';
  runtime.renderer = renderer;

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 600);
  runtime.camera = camera;
  applyCam();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080e1e);
  scene.fog = new THREE.FogExp2(0x080e1e, 0.018);
  runtime.scene = scene;

  // Lights
  const amb = new THREE.AmbientLight(0x334466, 1.2); scene.add(amb);
  const sun = new THREE.DirectionalLight(0xfff5dd, 2.2);
  sun.position.set(18, 28, 16); sun.castShadow = true; scene.add(sun);
  const fill = new THREE.DirectionalLight(0x4488cc, 0.4);
  fill.position.set(-12, 8, -20); scene.add(fill);

  const mkGrp = new THREE.Group(); scene.add(mkGrp);
  runtime.mkGrp = mkGrp;

  bindCameraControls(renderer.domElement);

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function bindCameraControls(el) {
  const orb = runtime.orb, drag = runtime.drag;

  el.addEventListener('mousedown', function (e) {
    orb.dragging = true; orb.autoRotate = false; drag.mx = e.clientX; drag.my = e.clientY;
    tcTogOff();
  });
  window.addEventListener('mouseup', function () { orb.dragging = false; });
  window.addEventListener('mousemove', function (e) {
    if (!orb.dragging) return;
    orb.theta -= (e.clientX - drag.mx) * .007;
    orb.phi = Math.max(.15, Math.min(1.45, orb.phi + (e.clientY - drag.my) * .005));
    drag.mx = e.clientX; drag.my = e.clientY; applyCam();
  });
  el.addEventListener('touchstart', function (e) {
    orb.dragging = true; orb.autoRotate = false; tcTogOff();
    drag.bx = e.touches[0].clientX; drag.by = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', function () { orb.dragging = false; });
  window.addEventListener('touchmove', function (e) {
    if (!orb.dragging) return;
    orb.theta -= (e.touches[0].clientX - drag.bx) * .007;
    orb.phi = Math.max(.15, Math.min(1.45, orb.phi + (e.touches[0].clientY - drag.by) * .005));
    drag.bx = e.touches[0].clientX; drag.by = e.touches[0].clientY; applyCam();
  }, { passive: true });
  el.addEventListener('wheel', function (e) {
    orb.radius = Math.max(8, Math.min(80, orb.radius + e.deltaY * .04));
    applyCam();
  }, { passive: true });
}

export function applyCam() {
  const orb = runtime.orb, camera = runtime.camera;
  const sp = Math.sin(orb.phi), cp = Math.cos(orb.phi);
  const st = Math.sin(orb.theta), ct = Math.cos(orb.theta);
  camera.position.set(orb.radius * sp * st, orb.radius * cp, orb.radius * sp * ct);
  camera.lookAt(0, 0, 0);
}

export function tcTogOff() {
  runtime.orb.autoRotate = false;
  const t = $('tc-tog');
  if (t) t.classList.remove('on');
}
