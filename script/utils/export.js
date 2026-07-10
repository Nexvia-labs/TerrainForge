
import { STATE, runtime } from '../core/state.js';
import { $ } from './utils.js';
import { toast } from './toast.js';

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
    ctx.fillText('Seed: ' + STATE.seed + ' | Trees: ' + runtime.treeCount + ' | Rocks: ' + runtime.rockCount, cv.width * .975, cv.height * .055);

    const lnk = document.createElement('a');
    lnk.download = 'terrainforge_' + STATE.seed + '_' + Date.now() + '.png';
    lnk.href = cv.toDataURL('image/png', 1); lnk.click();
    toast('Exported', 'PNG saved — Seed ' + STATE.seed + '.');
  } catch (e) {
    toast('Export Failed', e.message);
  }
}

// ── EXPORT OBJ ───────────────────────────────────────────────────

export function exportOBJ() {
  if (!runtime.terrainMesh) { toast('No Terrain', 'Generate a terrain first.'); return; }
  try {
    const geo = runtime.terrainMesh.geometry;
    const posArr = geo.attributes.position.array;
    const norArr = geo.attributes.normal ? geo.attributes.normal.array : null;
    const uvArr = geo.attributes.uv ? geo.attributes.uv.array : null;
    const colArr = geo.attributes.color ? geo.attributes.color.array : null;
    const idxArr = geo.index ? geo.index.array : null;
    const vc = geo.attributes.position.count;

    const out = [];
    out.push('# TerrainForge OBJ Export');
    out.push('# Seed: ' + STATE.seed);
    out.push('# Equation: h(x,y) = ' + STATE.eq);
    out.push('# Vertex colors encoded in v lines (r g b) — supported by Blender');
    out.push('o TerrainForge_' + STATE.seed);
    out.push('');

    // Vertices — include r g b per vertex for Blender vertex-color import
    for (let i = 0; i < vc; i++) {
      const x = posArr[i * 3], y = posArr[i * 3 + 1], z = posArr[i * 3 + 2];
      if (colArr) {
        const r = colArr[i * 3], g = colArr[i * 3 + 1], b = colArr[i * 3 + 2];
        out.push('v ' + x.toFixed(6) + ' ' + y.toFixed(6) + ' ' + z.toFixed(6) +
                 ' ' + r.toFixed(6) + ' ' + g.toFixed(6) + ' ' + b.toFixed(6));
      } else {
        out.push('v ' + x.toFixed(6) + ' ' + y.toFixed(6) + ' ' + z.toFixed(6));
      }
    }
    out.push('');

    // UVs
    if (uvArr) {
      for (let i = 0; i < vc; i++) {
        out.push('vt ' + uvArr[i * 2].toFixed(6) + ' ' + uvArr[i * 2 + 1].toFixed(6));
      }
      out.push('');
    }

    // Normals
    if (norArr) {
      for (let i = 0; i < vc; i++) {
        out.push('vn ' + norArr[i * 3].toFixed(6) + ' ' + norArr[i * 3 + 1].toFixed(6) + ' ' + norArr[i * 3 + 2].toFixed(6));
      }
      out.push('');
    }

    out.push('g terrain');
    out.push('s 1');

    // Faces — 1-indexed, same pos/uv/normal index per vertex
    const hasUV = !!uvArr, hasN = !!norArr;
    if (idxArr) {
      const fc = idxArr.length / 3;
      for (let i = 0; i < fc; i++) {
        const a = idxArr[i * 3] + 1, b = idxArr[i * 3 + 1] + 1, c = idxArr[i * 3 + 2] + 1;
        if (hasUV && hasN) {
          out.push('f ' + a + '/' + a + '/' + a + ' ' + b + '/' + b + '/' + b + ' ' + c + '/' + c + '/' + c);
        } else if (hasUV) {
          out.push('f ' + a + '/' + a + ' ' + b + '/' + b + ' ' + c + '/' + c);
        } else if (hasN) {
          out.push('f ' + a + '//' + a + ' ' + b + '//' + b + ' ' + c + '//' + c);
        } else {
          out.push('f ' + a + ' ' + b + ' ' + c);
        }
      }
    } else {
      // Non-indexed fallback
      for (let i = 0; i < vc; i += 3) {
        const a = i + 1, b = i + 2, c = i + 3;
        if (hasUV && hasN) {
          out.push('f ' + a + '/' + a + '/' + a + ' ' + b + '/' + b + '/' + b + ' ' + c + '/' + c + '/' + c);
        } else {
          out.push('f ' + a + ' ' + b + ' ' + c);
        }
      }
    }

    const blob = new Blob([out.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const lnk = document.createElement('a');
    lnk.download = 'terrainforge_' + STATE.seed + '_' + Date.now() + '.obj';
    lnk.href = url; lnk.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    toast('OBJ Exported', 'Vertex colors included — ready for Blender · Unreal · Unity');
  } catch (e) {
    toast('OBJ Failed', e.message);
  }
}
