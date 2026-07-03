// ─────────────────────────────────────────────────────────────────
// DB — thin IndexedDB wrapper used to persist saved map projects
// in the browser (name, captured STATE, and a thumbnail).
// ─────────────────────────────────────────────────────────────────

import { runtime, DB_NAME, DB_VER, DB_STORE } from './script/core/state.js';

export function openDB(cb) {
  if (runtime.idb) { cb(runtime.idb); return; }
  const req = indexedDB.open(DB_NAME, DB_VER);
  req.onupgradeneeded = function (e) {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(DB_STORE)) {
      db.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
    }
  };
  req.onsuccess = function (e) { runtime.idb = e.target.result; cb(runtime.idb); };
  req.onerror = function (e) { console.error('IDB', e); };
}

export function getAllMaps(cb) {
  openDB(function (db) {
    const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).getAll();
    req.onsuccess = function (e) { cb(e.target.result || []); };
    req.onerror = function () { cb([]); };
  });
}

export function getMapById(id, cb) {
  openDB(function (db) {
    const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(id);
    req.onsuccess = function (e) { cb(e.target.result || null); };
    req.onerror = function () { cb(null); };
  });
}

export function saveMapDB(proj, cb) {
  openDB(function (db) {
    const req = db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).put(proj);
    req.onsuccess = function (e) { cb && cb(e.target.result); };
    req.onerror = function (e) { console.error('Save', e); };
  });
}

export function deleteMapDB(id, cb) {
  openDB(function (db) {
    const req = db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).delete(id);
    req.onsuccess = function () { cb && cb(); };
    req.onerror = function (e) { console.error('Del', e); };
  });
}
