
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

// ── SPLATMAP (RGBA weightmap) EXPORT ────────────────────────────
// R=sand/beach, G=grass/forest, B=rock, A=snow

export function exportSplatmap() {
  if (!runtime.heightCache) { toast('No Terrain', 'Generate a terrain first.'); return; }
  const hmap = runtime.heightCache.hmap, GRID = runtime.heightCache.GRID, s = runtime.heightCache.s;
  const cv = document.createElement('canvas');
  cv.width = GRID; cv.height = GRID;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(GRID, GRID);
  const zRng = runtime.zMax - runtime.zMin || 1;
  const seaN = (STATE.seaLevel - runtime.zMin) / zRng;
  const bw = STATE.beachW, bl = STATE.cBlend;
  const flo = STATE.forestLo + seaN, fhi = STATE.forestHi, sn2 = STATE.snowLine;

  function smoo(x, e0, e1) { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const k = j * GRID + i;
      const hn = Math.max(0, Math.min(1, (hmap[k] - runtime.zMin) / zRng));
      // Slope
      const dx = i > 0 && i < GRID - 1 ? hmap[j * GRID + i + 1] - hmap[j * GRID + i - 1] : 0;
      const dz = j > 0 && j < GRID - 1 ? hmap[(j + 1) * GRID + i] - hmap[(j - 1) * GRID + i] : 0;
      const slope = Math.min(1, Math.sqrt(dx * dx + dz * dz) / (s * 2));

      let rSand = 0, gGrass = 0, bRock = 0, aSnow = 0;

      if (hn < seaN + bw) {
        rSand = 255;
      } else if (hn > sn2) {
        aSnow = 255;
        bRock = Math.round(smoo(hn, sn2, sn2 + bl) * 128);
      } else if (slope > 0.5) {
        bRock = Math.round(smoo(slope, 0.4, 0.75) * 255);
        gGrass = 255 - bRock;
      } else if (hn > fhi) {
        bRock = Math.round(smoo(hn, fhi, fhi + bl) * 200);
        gGrass = 255 - bRock;
      } else {
        gGrass = 255;
        rSand = Math.round(smoo(seaN + bw, hn, flo) * 120);
        gGrass = 255 - rSand;
      }

      img.data[k * 4 + 0] = rSand;
      img.data[k * 4 + 1] = gGrass;
      img.data[k * 4 + 2] = bRock;
      img.data[k * 4 + 3] = aSnow;
    }
  }
  ctx.putImageData(img, 0, 0);
  const lnk = document.createElement('a');
  lnk.download = 'splatmap_seed' + STATE.seed + '_' + GRID + 'x' + GRID + '.png';
  lnk.href = cv.toDataURL('image/png');
  lnk.click();
  toast('Splatmap Exported', 'RGBA: R=Sand, G=Grass/Forest, B=Rock, A=Snow. Use as layer weight in URP/HDRP.');
}

// ── GLB EXPORT (binary glTF) ─────────────────────────────────────
// Minimal glTF 2.0 binary format with vertex colors as COLOR_0

export function exportGLB() {
  if (!runtime.terrainMesh) { toast('No Terrain', 'Generate a terrain first.'); return; }
  try {
    const geo = runtime.terrainMesh.geometry;
    const posArr = geo.attributes.position.array;
    const norArr = geo.attributes.normal ? geo.attributes.normal.array : null;
    const colArr = geo.attributes.color ? geo.attributes.color.array : null;
    const idxArr = geo.index ? geo.index.array : null;
    const vc = geo.attributes.position.count;

    // Build buffers
    const posBuf = new Float32Array(posArr).buffer;
    const norBuf = norArr ? new Float32Array(norArr).buffer : null;
    const colBuf = colArr ? new Float32Array(colArr).buffer : null;
    const idxBuf = idxArr ? new Uint32Array(idxArr).buffer : null;

    const bufViews = [], accessors = [], attrs = {}, bufferData = [];
    let offset = 0;

    function addBV(buf, target) {
      bufferData.push(new Uint8Array(buf));
      const bv = { buffer: 0, byteOffset: offset, byteLength: buf.byteLength, target: target };
      bufViews.push(bv);
      offset += buf.byteLength;
      // pad to 4-byte align
      const pad = (4 - (buf.byteLength % 4)) % 4;
      if (pad > 0) { bufferData.push(new Uint8Array(pad)); offset += pad; }
      return bufViews.length - 1;
    }

    // Positions
    const minP = [Infinity, Infinity, Infinity], maxP = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < vc; i++) { for (let d = 0; d < 3; d++) { const v = posArr[i * 3 + d]; if (v < minP[d]) minP[d] = v; if (v > maxP[d]) maxP[d] = v; } }
    const bvPos = addBV(posBuf, 34962);
    accessors.push({ bufferView: bvPos, byteOffset: 0, componentType: 5126, count: vc, type: 'VEC3', min: minP, max: maxP });
    attrs['POSITION'] = accessors.length - 1;

    // Normals
    if (norBuf) {
      const bvNor = addBV(norBuf, 34962);
      accessors.push({ bufferView: bvNor, byteOffset: 0, componentType: 5126, count: vc, type: 'VEC3' });
      attrs['NORMAL'] = accessors.length - 1;
    }

    // Vertex colors (RGB float)
    if (colBuf) {
      const bvCol = addBV(colBuf, 34962);
      accessors.push({ bufferView: bvCol, byteOffset: 0, componentType: 5126, count: vc, type: 'VEC3' });
      attrs['COLOR_0'] = accessors.length - 1;
    }

    // Indices
    let idxAcc = -1;
    if (idxBuf) {
      const bvIdx = addBV(idxBuf, 34963);
      accessors.push({ bufferView: bvIdx, byteOffset: 0, componentType: 5125, count: idxArr.length, type: 'SCALAR' });
      idxAcc = accessors.length - 1;
    }

    // Material (vertex color unlit-ish)
    const materials = [{
      name: 'TerrainMat',
      pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.9 },
      extensions: { KHR_materials_unlit: {} }
    }];

    const mesh = { primitives: [{ attributes: attrs, material: 0 }] };
    if (idxAcc >= 0) mesh.primitives[0].indices = idxAcc;

    // Merge all buffer data
    const totalLen = offset;
    const combined = new Uint8Array(totalLen);
    let pos2 = 0;
    for (let i = 0; i < bufferData.length; i++) { combined.set(bufferData[i], pos2); pos2 += bufferData[i].length; }

    const json = {
      asset: { version: '2.0', generator: 'TerrainForge' },
      extensionsUsed: ['KHR_materials_unlit'],
      scene: 0, scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0, name: 'Terrain' }],
      meshes: [mesh],
      materials: materials,
      accessors: accessors,
      bufferViews: bufViews,
      buffers: [{ byteLength: totalLen }]
    };

    let jsonStr = JSON.stringify(json);
    // Pad JSON to 4-byte align
    while (jsonStr.length % 4 !== 0) jsonStr += ' ';
    const jsonBytes = new TextEncoder().encode(jsonStr);

    // GLB header: magic, version, total length
    const headerLen = 12, chunk0Len = 8 + jsonBytes.length, chunk1Len = 8 + combined.length;
    const total = headerLen + chunk0Len + chunk1Len;
    const out = new ArrayBuffer(total);
    const dv = new DataView(out);
    dv.setUint32(0, 0x46546C67, true); // magic 'glTF'
    dv.setUint32(4, 2, true);           // version 2
    dv.setUint32(8, total, true);
    dv.setUint32(12, jsonBytes.length, true);
    dv.setUint32(16, 0x4E4F534A, true); // 'JSON'
    new Uint8Array(out, 20, jsonBytes.length).set(jsonBytes);
    dv.setUint32(20 + jsonBytes.length, combined.length, true);
    dv.setUint32(24 + jsonBytes.length, 0x004E4942, true); // 'BIN\0'
    new Uint8Array(out, 28 + jsonBytes.length, combined.length).set(combined);

    const blob = new Blob([out], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const lnk = document.createElement('a');
    lnk.download = 'terrain_seed' + STATE.seed + '_' + Date.now() + '.glb';
    lnk.href = url; lnk.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    toast('GLB Exported', 'Binary glTF 2.0 with vertex colors. Open in Blender, Unity, or Unreal Engine.');
  } catch (e) {
    toast('GLB Failed', e.message);
  }
}
