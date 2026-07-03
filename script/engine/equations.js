

import { sn, fbmN, ridgeN, domWarp } from './script/engine/noise.js';

// Each builtin returns a function(x,y) -> height
const _builtins = {
  island: function (x, y, r) {
    r = r || 3.5;
    const d = Math.sqrt(x * x + y * y);
    let mask = Math.max(0, 1 - d / r);
    mask = mask * mask * (3 - 2 * mask);
    return fbmN(x, y, 6) * 2.5 * mask - (1 - mask) * 0.5;
  },
  canyon: function (x, y) {
    const base = fbmN(x * 0.5, y * 0.5, 5) * 3;
    const cut = Math.abs(sn(x * 0.8, y * 0.3 + 10)) * 2.5;
    return Math.max(0, base - cut);
  },
  volcano: function (x, y) {
    const d = Math.sqrt(x * x + y * y);
    const cone = Math.max(0, 2 - d) * 1.4;
    const crater = d < 0.8 ? -1.5 + d * 2 : 0;
    return cone + crater + fbmN(x, y, 4) * 0.4;
  },
  fjord: function (x, y) {
    const base = fbmN(x * 0.7, y * 0.7, 6) * 3;
    const cut = Math.max(0, 1.5 - Math.abs(sn(x * 0.4, y * 0.2) * 3)) * 1.8;
    return base - cut;
  },
  mesa: function (x, y) {
    const h = fbmN(x * 0.6, y * 0.6, 4) * 2.5;
    return Math.floor(h * 4) / 4 + fbmN(x * 3, y * 3, 2) * 0.15;
  },
  archipelago: function (x, y) {
    return sn(x * 0.4, y * 0.4) * 3 + fbmN(x, y, 5) * 1.5 - 0.8;
  },
  plains: function (x, y) {
    return fbmN(x * 0.5, y * 0.5, 3) * 0.6 + fbmN(x * 2, y * 2, 2) * 0.15;
  }
};

/**
 * Compile a heightmap equation string into a callable function(x,y,t).
 * Uses `new Function` (no `with`, which is forbidden in strict mode)
 * with every math/noise/builtin helper injected as a named parameter.
 */
export function getEquationFn(eq) {
  let fn;
  try {
    fn = new Function(
      'x', 'y', 't',
      // Math
      'sin', 'cos', 'tan', 'abs', 'sqrt', 'pow', 'floor', 'ceil', 'round', 'max', 'min', 'log', 'exp', 'PI',
      // Terrain helpers
      'fbm', 'ridge', 'noise', 'dist', 'warp',
      'island', 'canyon', 'volcano', 'fjord', 'mesa', 'archipelago', 'plains',
      'return (' + eq + ');'
    );
  } catch (e) {
    return function () { return 0; };
  }
  return function (x, y, t) {
    try {
      return fn(
        x, y, t || 0,
        Math.sin, Math.cos, Math.tan, Math.abs, Math.sqrt, Math.pow,
        Math.floor, Math.ceil, Math.round, Math.max, Math.min, Math.log, Math.exp, Math.PI,
        function (a, b, o, r) { return fbmN(a, b, o, r); },
        function (a, b) { return ridgeN(a, b); },
        function (a, b) { return sn(a, b); },
        function (a, b, cx, cy) { return Math.sqrt(Math.pow(a - (cx || 0), 2) + Math.pow(b - (cy || 0), 2)); },
        function (a, b, s) { return domWarp(a, b, s || 0.8); },
        _builtins.island, _builtins.canyon, _builtins.volcano,
        _builtins.fjord, _builtins.mesa, _builtins.archipelago, _builtins.plains
      );
    } catch (e) { return 0; }
  };
}
