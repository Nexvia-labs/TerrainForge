function bindGraphicsControls(){
  // ── Sun angle — elevation (height above horizon) + azimuth (compass
  // direction). Both recompute SUN_DIR and re-fit the shadow frustum live,
  // no regenerate needed — see updateSunDirectionFromAngles() in scene-setup.js.
  var elEl = document.getElementById('sl-sun-elev');
  if(elEl){
    elEl.addEventListener('input', function(){
      STATE.sunElevation = parseFloat(elEl.value);
      var vEl = document.getElementById('v-sun-elev');
      if(vEl) vEl.textContent = STATE.sunElevation.toFixed(1)+'°';
      if(typeof updateSunDirectionFromAngles==='function') updateSunDirectionFromAngles();
    });
  }
  var azEl = document.getElementById('sl-sun-azim');
  if(azEl){
    azEl.addEventListener('input', function(){
      STATE.sunAzimuth = parseFloat(azEl.value);
      var vEl = document.getElementById('v-sun-azim');
      if(vEl) vEl.textContent = Math.round(STATE.sunAzimuth)+'°';
      if(typeof updateSunDirectionFromAngles==='function') updateSunDirectionFromAngles();
    });
  }

  // ── Water reflectivity — 0 = matte/diffuse, 1 = mirror-like. Drives
  // material.roughness directly (roughness = 1-reflectivity) so the
  // change is visible immediately, without waiting for a regenerate.
  var reflEl = document.getElementById('sl-water-refl');
  if(reflEl){
    reflEl.addEventListener('input', function(){
      STATE.waterReflectivity = parseFloat(reflEl.value);
      var vEl = document.getElementById('v-water-refl');
      if(vEl) vEl.textContent = STATE.waterReflectivity.toFixed(2);
      if(waterMesh) waterMesh.material.roughness = 1-STATE.waterReflectivity;
    });
  }
}
