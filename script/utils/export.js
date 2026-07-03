
import { STATE, runtime } from './script/core/state.js';
import { $ } from './script/utils/utils.js';
import { toast } from './script/utils/toast.js';

export function trigExport() {
  if (runtime.pendingExport) return;
  runtime.pendingExport = true;
  $('btn-export').textContent = 'Capturing…';
}

export function doExport() {
  runtime.pendingExport = false;
  $('btn-export').textContent = '↓ PNG';
  try {
    const renderer = runtime.renderer, scene = runtime.scene, camera = runtime.camera;
    renderer.render(scene, camera);
    const cv = document.createElement('canvas');
    cv.width = renderer.domElement.width; cv.height = renderer.domElement.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(renderer.domElement, 0, 0);

    const sc = Math.max(1, cv.width / 1440);
    const gr = ctx.createLinearGradient(0, cv.height * .6, 0, cv.height);
    gr.addColorStop(0, 'rgba(3,9,18,0)'); gr.addColorStop(1, 'rgba(3,9,18,.72)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, cv.width, cv.height);

    ctx.fillStyle = 'rgba(230,242,255,.9)'; ctx.font = 'bold ' + Math.round(20 * sc) + 'px Oxanium,sans-serif';
    ctx.fillText('TerrainForge', cv.width * .025, cv.height * .055);

    ctx.font = Math.round(11 * sc) + 'px JetBrains Mono,monospace';
    ctx.fillStyle = 'rgba(88,200,248,.8)';
    ctx.fillText('h(x,y) = ' + STATE.eq.slice(0, 60), cv.width * .025, cv.height - .03 * cv.height);

    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(88,118,165,.6)'; ctx.font = Math.round(9 * sc) + 'px monospace';
    ctx.fillText('Trees: ' + runtime.treeCount + ' | Rocks: ' + runtime.rockCount, cv.width * .975, cv.height * .055);

    const lnk = document.createElement('a');
    lnk.download = 'terrainforge_' + Date.now() + '.png';
    lnk.href = cv.toDataURL('image/png', 1); lnk.click();
    toast('Exported', 'PNG saved to your downloads.');
  } catch (e) {
    toast('Export Failed', e.message);
  }
}
