
export const SURF = 20; // world units spanned by the terrain grid

export const STATE = {
  eq: 'fbm(x,y,6)*3 + ridge(x,y)*1.5',
  scale: 1.0, amp: 2.0, oct: 6, rough: 0.5,
  res: 128, erosion: 0.0,
  seaLevel: 0.0, wAlpha: 0.6, wSpeed: 0.4, wHeight: 0.08,
  riverOn: false, riverDepth: 0.6, riverWarp: 0.8,
  treeDensity: 0.5, rockDensity: 0.3,
  snowLine: 0.78, forestLo: 0.12, forestHi: 0.62, maxSlope: 0.8,
  colors: {
    deep: '#1a6bbd', shallow: '#3d8fd4', sand: '#e6c97a', grass: '#4a9e3f',
    forest: '#2d6b24', rock: '#8a7d6e', snow: '#e8eef2'
  },
  cBlend: 0.08, beachW: 0.04,
  wireframe: false, flatShade: false,
  seed: 42, layers: [],
  autoRotate: true
};

/** The default equation used whenever a brand-new map is created. */
export const DEFAULT_EQUATION = 'fbm(x,y,6)*3 + ridge(x,y)*1.5';


export const runtime = {
  // three.js core objects
  renderer: null, camera: null, scene: null,
  terrainMesh: null, waterMesh: null, mkGrp: null,

  // orbit-camera control state
  orb: { theta: -2.2, phi: 1.0, radius: 32, dragging: false, autoRotate: true },
  drag: { mx: 0, my: 0, bx: 0, by: 0 },

  // generation
  gTime: 0,
  heightCache: null,
  zMin: 0, zMax: 1,

  // foliage counters
  treeCount: 0, rockCount: 0,

  // layer id sequence
  layerIdCounter: 0,

  // export-to-PNG flag (consumed by the animation loop)
  pendingExport: false,

  // generation lock to avoid overlapping builds
  generating: false,

  // currently open saved-project id (IndexedDB key), null = unsaved
  currentProjectId: null,

  // cached IndexedDB handle
  idb: null,
};

// IndexedDB constants
export const DB_NAME = 'TerrainForgeDB';
export const DB_VER = 1;
export const DB_STORE = 'maps';
