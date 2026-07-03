import { runtime } from './script/core/state.js';
import { $ } from './script/utils/utils.js';
import { buildHeightmap } from './script/engine/heightmap.js';
import { buildTerrainMesh } from './script/engine/terrain-mesh.js';
import { buildWater } from './script/environment/water.js';
import { spawnFoliage } from './script/environment/foliage.js';
import { updateStats } from './script/utils/stats.js';
import { toast } from './script/utils/toast.js';

export function generate(showProgress) {
  if (runtime.generating) return;
  runtime.generating = true;
  if (showProgress !== false) showGenProgress();

  setTimeout(function () {
    setProgress(10, 'Building heightmap…');

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

            setTimeout(function () {
              hideGenProgress();
              runtime.generating = false;
              toast('Terrain Built', runtime.treeCount + ' trees, ' + runtime.rockCount + ' rocks placed.');
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
