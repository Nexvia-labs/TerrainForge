import { STATE, runtime } from '../core/state.js';
import { $ } from '../utils/utils.js';
import { buildHeightmap } from './heightmap.js';
import { buildTerrainMesh } from './terrain-mesh.js';
import { buildWater } from '../environment/water.js';
import { spawnFoliage } from '../environment/foliage.js';
import { reseedNoise } from './noise.js';
import { updateStats } from '../utils/stats.js';
import { updateDNA } from '../utils/seed.js';
import { toast } from '../utils/toast.js';

export function generate(showProgress) {
  if (runtime.generating) return;
  runtime.generating = true;
  if (showProgress !== false) showGenProgress();

  setTimeout(function () {
    setProgress(10, 'Building heightmap…');
    reseedNoise(STATE.seed);

    setTimeout(function () {
      let data;
      try { data = buildHeightmap(); }
      catch (e) { toast('Error', 'Heightmap failed: ' + e.message); hideGenProgress(); runtime.generating = false; return; }
      runtime.heightCache = data;
      setProgress(40, 'Meshing terrain…');

      setTimeout(function () {
        let slopes;
        try { slopes = buildTerrainMesh(data); }
        catch (e) { toast('Error', 'Mesh failed: ' + e.message); hideGenProgress(); runtime.generating = false; return; }
        setProgress(65, 'Spawning water…');

        setTimeout(function () {
          buildWater();
          setProgress(78, 'Placing trees & rocks…');

          setTimeout(function () {
            spawnFoliage(data, slopes);
            setProgress(100, 'Done!');
            updateStats();
            updateDNA();

            setTimeout(function () {
              hideGenProgress();
              runtime.generating = false;
              toast('Terrain Built', 'Seed ' + STATE.seed + ' — ' + runtime.treeCount + ' trees, ' + runtime.rockCount + ' rocks.');
            }, 350);
          }, 20);
        }, 10);
      }, 10);
    }, 10);
  }, 40);
}

export function showGenProgress() {
  $('gen-progress').style.display = 'flex';
  setProgress(0, 'Starting…');
}

export function hideGenProgress() {
  $('gen-progress').style.display = 'none';
}

export function setProgress(pct, label) {
  $('prog-bar').style.width = pct + '%';
  $('prog-label').textContent = label;
}
