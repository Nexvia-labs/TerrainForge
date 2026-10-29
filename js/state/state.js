// ============================================================
// TerrainForge Pro — state.js
// The central STATE object (every user-facing setting) plus the SURF world-scale constant.
// Classic script (shares global scope with every other module —
// see index.html for required load order).
// ============================================================

var STATE = {
  eq: 'fbm(x,y,6)*3 + ridge(x,y)*1.5',
  scale: 1.0, amp: 2.0, oct: 4, rough: 0.5,
  res: 80, erosion: 0.0,
  erosionType: 'none',
  droplets: 3000, inertia: 0.05, eroRate: 0.3, depRate: 0.3, evap: 0.02,
  talusAngle: 30, thermIters: 20,
  showFlowMap: false,
  seaLevel: 0.0, wAlpha: 0.6, wSpeed: 0.4, wHeight: 0.08,
  waterEqOn: false, waterEq: 'sin(x*1.2+t*0.6)*0.6 + sin(y*0.9-t*0.5)*0.4',
  // ── Water engine parity additions — same equation compiler, biharmonic
  // PDE smoothing (ν∇²u − μ∇⁴u) and layer-coloring system as the Wave Lab
  // (js/water/wave-lab.js), applied to the real ocean surface. Numeric
  // defaults are chosen as no-ops so existing water looks unchanged until
  // a slider is moved or a palette picked. ──
  waterEq2: 'cos(y*3 - t*1.5) * sin(x*2 + t)', waterBattleMode: false,
  waterFeedbackEnabled: false,
  waterSpatialFreq: 1.0, waterPhase: 0.0, waterDamp: 0.0, waterHeightOffset: 0.0,
  waterViscosity: 0.0, waterHyperViscosity: 0.0,
  waterColorMode: 'off', // 'off' | 'spectrum' | 'fire' | 'ice' | 'plasma' | 'neon' | 'custom'
  waterCustomLow: [0.10,0.27,1.00], waterCustomMid: [0.67,0.13,0.80], waterCustomHigh: [1.00,0.27,0.53],
  riverOn: false, riverDepth: 0.6, riverWarp: 0.8,
  // ── Shaders / Graphics tab ──────────────────────────────────────
  // Sun elevation/azimuth (degrees) — defaults reconstruct the app's
  // original fixed SUN_DIR=normalize(18,28,16) to float-noise precision,
  // so adding this control changes nothing until a slider moves. See
  // updateSunDirectionFromAngles() in scene-setup.js.
  sunElevation: 49.30, sunAzimuth: 48.37,
  // Water reflectivity (0=matte, 1=mirror-like) — drives the water
  // material's roughness (roughness = 1-reflectivity). Default 0.82
  // reconstructs the original fixed roughness of 0.18. See
  // createWaterMaterial() in water.js.
  waterReflectivity: 0.82,
  riverGenThresh: 0.22, riverCarveDepth: 0.28, riverCarveWidth: 1, riverCarveOn: true,
  treeDensity: 0.5, rockDensity: 0.3,
  snowLine: 0.78, forestLo: 0.12, forestHi: 0.62, maxSlope: 0.8,
  colors:{deep:'#1a6bbd',shallow:'#3d8fd4',sand:'#e6c97a',grass:'#4a9e3f',
          forest:'#2d6b24',rock:'#8a7d6e',snow:'#e8eef2'},
  cBlend:0.08, beachW:0.04,
  wireframe:false, flatShade:false, showNormals:false,
  seed: 42, layers: [],
  autoRotate: true,
  mapArea: 1.0,      // World-space area multiplier (1 = default, up to 8 = 8× larger map)
  regions: [],       // Terrain zone presets painted across the map
  importedTerrains: [], // Exact-size terrains imported from other saved maps (max 5)
  lodEnabled: false, // Automatic camera-distance Level of Detail (terrain mesh)
  // ── Climate Biome System — classification driven by height + moisture + temperature ──
  climateOn: true,
  moistureScale: 1.0,
  tempScale: 1.0,
  tempLapse: 0.85,             // how much temperature drops per unit of elevation
  coastalMoistureBoost: 0.4,   // extra moisture near water bodies
  // ── Tree Level-of-Detail — billboard (far) ↔ low-poly (mid) ↔ full mesh (near) ──
  treeLODEnabled: true,
  treeLodNearMult: 1.0,
  treeLodFarMult: 1.0
};

var SURF = 20; // world units

