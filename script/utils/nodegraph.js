import { STATE } from '../core/state.js';
import { $ } from './utils.js';
import { generate } from '../engine/generator.js';
import { updateDNA } from './seed.js';

export const NG = {
  nodes: {},
  connections: [],  // [{fromId, fromPort, toId, toPort}]
  dragging: null,   // {id, ox, oy}
  connecting: null, // {fromId, fromPort, x, y}
  nodeIdCounter: 0,

  // Node definitions
  types: {
    fbm: { label: 'FBM Noise', color: '#1a4d7a', inputs: [], outputs: ['h'], params: { oct: 6, rough: 0.5, scale: 1.0 } },
    ridge: { label: 'Ridge Noise', color: '#1a4d7a', inputs: [], outputs: ['h'], params: { scale: 1.0 } },
    warp: { label: 'Domain Warp', color: '#1a4d7a', inputs: [], outputs: ['h'], params: { strength: 0.8, scale: 1.0 } },
    island: { label: 'Island', color: '#1a5c3a', inputs: [], outputs: ['h'], params: { radius: 3.5 } },
    canyon: { label: 'Canyon', color: '#5c3a1a', inputs: [], outputs: ['h'], params: {} },
    volcano: { label: 'Volcano', color: '#7a1a1a', inputs: [], outputs: ['h'], params: {} },
    mesa: { label: 'Mesa', color: '#5c4a1a', inputs: [], outputs: ['h'], params: {} },
    add: { label: 'Add A+B', color: '#2d2d6e', inputs: ['a', 'b'], outputs: ['out'], params: {} },
    multiply: { label: 'Multiply A×B', color: '#2d2d6e', inputs: ['a', 'b'], outputs: ['out'], params: { k: 1.0 } },
    subtract: { label: 'Subtract A-B', color: '#2d2d6e', inputs: ['a', 'b'], outputs: ['out'], params: {} },
    scale: { label: 'Scale A×k', color: '#2d2d6e', inputs: ['a'], outputs: ['out'], params: { k: 1.5 } },
    offset: { label: 'Offset A+k', color: '#2d2d6e', inputs: ['a'], outputs: ['out'], params: { k: 0.5 } },
    output: { label: '★ Output', color: '#3d1a5c', inputs: ['h'], outputs: [], params: {} }
  },

  init: function () {
    const wrap = $('ng-canvas-wrap');
    if (!wrap) return;
    const nodes = $('ng-nodes');
    const svg = $('ng-svg');
    const status = $('ng-status');

    // Add node
    $('ng-add-node').addEventListener('change', function () {
      const t = this.value; if (!t) return;
      this.value = '';
      NG.addNode(t, 60 + Math.random() * 180, 30 + Math.random() * 140);
    });

    $('ng-compile').addEventListener('click', function () {
      const eq = NG.compile();
      if (!eq) { status.textContent = 'No Output node or incomplete graph.'; status.style.color = 'var(--er)'; return; }
      STATE.eq = eq;
      $('terrain-eq').value = eq;
      STATE.eq = eq;
      $('terrain-eq').classList.remove('ie');
      status.textContent = 'Compiled: ' + eq.slice(0, 50) + (eq.length > 50 ? '…' : '');
      status.style.color = 'var(--ok)';
      updateDNA();
      generate();
    });

    $('ng-clear').addEventListener('click', function () {
      NG.nodes = {}; NG.connections = []; NG.nodeIdCounter = 0;
      nodes.innerHTML = ''; NG.renderEdges(); status.textContent = 'Graph cleared.'; status.style.color = 'var(--t3)';
    });

    // SVG edge interaction (abort connection on background click)
    wrap.addEventListener('mousedown', function (e) {
      if (e.target === wrap || e.target === nodes || e.target === svg) {
        if (NG.connecting) { NG.connecting = null; NG.renderEdges(); }
      }
    });

    // Seed an example graph
    NG.addNode('fbm', 30, 20);
    NG.addNode('ridge', 30, 120);
    NG.addNode('add', 210, 70);
    NG.addNode('output', 370, 70);
  },

  addNode: function (type, x, y) {
    const def = NG.types[type]; if (!def) return;
    const id = 'n' + (++NG.nodeIdCounter);
    const node = { id: id, type: type, x: x, y: y, params: JSON.parse(JSON.stringify(def.params || {})) };
    NG.nodes[id] = node;
    NG.renderNode(node);
    NG.renderEdges();
    return node;
  },

  renderNode: function (node) {
    const def = NG.types[node.type];
    const wrap = $('ng-nodes');
    // Remove old
    const old = $('ngn-' + node.id);
    if (old) old.remove();

    const el = document.createElement('div');
    el.id = 'ngn-' + node.id;
    el.style.cssText = 'position:absolute;left:' + node.x + 'px;top:' + node.y + 'px;' +
      'background:' + def.color + ';border:1px solid rgba(80,145,255,.4);border-radius:7px;' +
      'min-width:110px;cursor:move;z-index:5;user-select:none;' +
      'box-shadow:0 3px 14px rgba(0,0,0,.6)';

    const title = '<div style="font-family:var(--fd);font-size:9px;font-weight:600;' +
      'color:rgba(230,242,255,.9);padding:5px 9px 4px;letter-spacing:.05em;' +
      'border-bottom:1px solid rgba(255,255,255,.1)">' + def.label + '</div>';

    // Params
    let paramHTML = '';
    Object.keys(node.params).forEach(function (k) {
      paramHTML += '<div style="display:flex;align-items:center;gap:4px;padding:2px 8px">' +
        '<span style="font-size:7.5px;color:rgba(200,220,255,.6);min-width:30px;font-family:var(--fd)">' + k + '</span>' +
        '<input type="range" data-pid="' + k + '" min="-4" max="12" step="0.1" value="' + node.params[k] + '" ' +
        'style="width:52px;height:2px;accent-color:#58c8f8">' +
        '<span class="ngpv" style="font-family:var(--fm);font-size:8px;color:#58c8f8;min-width:24px">' + parseFloat(node.params[k]).toFixed(1) + '</span>' +
        '</div>';
    });

    // Port rows
    let portsHTML = '<div style="display:flex;justify-content:space-between;padding:4px 0 5px">';
    let leftPorts = '<div style="display:flex;flex-direction:column;gap:3px">';
    def.inputs.forEach(function (p) {
      leftPorts += '<div style="display:flex;align-items:center;gap:3px;padding:0 0 0 -5px">' +
        '<div class="ng-port" data-nid="' + node.id + '" data-port="' + p + '" data-dir="in" ' +
        'style="width:10px;height:10px;border-radius:50%;background:rgba(88,200,248,.4);' +
        'border:1px solid #58c8f8;cursor:pointer;margin-left:-5px;flex-shrink:0"></div>' +
        '<span style="font-size:7px;color:rgba(170,200,235,.7);font-family:var(--fd)">' + p + '</span>' +
        '</div>';
    });
    leftPorts += '</div>';
    let rightPorts = '<div style="display:flex;flex-direction:column;gap:3px;align-items:flex-end">';
    def.outputs.forEach(function (p) {
      rightPorts += '<div style="display:flex;align-items:center;gap:3px">' +
        '<span style="font-size:7px;color:rgba(170,200,235,.7);font-family:var(--fd)">' + p + '</span>' +
        '<div class="ng-port" data-nid="' + node.id + '" data-port="' + p + '" data-dir="out" ' +
        'style="width:10px;height:10px;border-radius:50%;background:rgba(238,187,85,.4);' +
        'border:1px solid #eebb55;cursor:pointer;margin-right:-5px;flex-shrink:0"></div>' +
        '</div>';
    });
    rightPorts += '</div>';
    portsHTML += leftPorts + rightPorts + '</div>';

    // Delete button
    const del = '<div style="text-align:right;padding:0 6px 5px">' +
      '<button data-del="' + node.id + '" style="font-size:8px;color:rgba(240,68,102,.7);background:none;border:none;cursor:pointer;font-family:var(--fd)">✕ del</button>' +
      '</div>';

    el.innerHTML = title + paramHTML + portsHTML + del;
    wrap.appendChild(el);

    // Param sliders
    el.querySelectorAll('input[type=range][data-pid]').forEach(function (inp) {
      const vSpan = inp.nextElementSibling;
      inp.addEventListener('input', function () {
        node.params[inp.dataset.pid] = parseFloat(inp.value);
        if (vSpan) vSpan.textContent = parseFloat(inp.value).toFixed(1);
      });
    });

    // Delete
    el.querySelector('[data-del]').addEventListener('click', function (e) {
      e.stopPropagation();
      const nid = e.currentTarget.dataset.del;
      NG.connections = NG.connections.filter(function (c) { return c.fromId !== nid && c.toId !== nid; });
      delete NG.nodes[nid];
      el.remove(); NG.renderEdges();
    });

    // Port click
    el.querySelectorAll('.ng-port').forEach(function (port) {
      port.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        const nid = port.dataset.nid, pn = port.dataset.port, dir = port.dataset.dir;
        if (dir === 'out') {
          // Start connection
          const r = port.getBoundingClientRect();
          const wrapR = $('ng-canvas-wrap').getBoundingClientRect();
          NG.connecting = { fromId: nid, fromPort: pn, x: r.left - wrapR.left + 5, y: r.top - wrapR.top + 5 };
        } else if (dir === 'in' && NG.connecting) {
          // Complete connection
          // Remove existing connection to this input port
          NG.connections = NG.connections.filter(function (c) { return !(c.toId === nid && c.toPort === pn); });
          NG.connections.push({ fromId: NG.connecting.fromId, fromPort: NG.connecting.fromPort, toId: nid, toPort: pn });
          NG.connecting = null;
          NG.renderEdges();
        }
      });
    });

    // Drag
    el.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      e.stopPropagation();
      NG.dragging = { id: node.id, ox: e.clientX - node.x, oy: e.clientY - node.y };
    });
  },

  getPortPos: function (nid, port, dir) {
    const el = $('ngn-' + nid);
    if (!el) return { x: 0, y: 0 };
    const wrapR = $('ng-canvas-wrap').getBoundingClientRect();
    const ports = el.querySelectorAll('.ng-port');
    for (let i = 0; i < ports.length; i++) {
      if (ports[i].dataset.port === port && ports[i].dataset.dir === dir) {
        const r = ports[i].getBoundingClientRect();
        return { x: r.left - wrapR.left + 5, y: r.top - wrapR.top + 5 };
      }
    }
    return { x: dir === 'in' ? NG.nodes[nid].x : NG.nodes[nid].x + 120, y: NG.nodes[nid].y + 30 };
  },

  renderEdges: function () {
    const svg = $('ng-svg');
    if (!svg) return;
    svg.innerHTML = '';
    NG.connections.forEach(function (c) {
      const p0 = NG.getPortPos(c.fromId, c.fromPort, 'out');
      const p1 = NG.getPortPos(c.toId, c.toPort, 'in');
      const dx = Math.abs(p1.x - p0.x) * 0.5;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M' + p0.x + ',' + p0.y + ' C' + (p0.x + dx) + ',' + p0.y + ' ' + (p1.x - dx) + ',' + p1.y + ' ' + p1.x + ',' + p1.y);
      path.setAttribute('stroke', 'rgba(88,200,248,.65)');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
    });
    // Pending connection
    if (NG.connecting) {
      const p0 = { x: NG.connecting.x, y: NG.connecting.y };
      const p1 = { x: NG.connecting.mx || p0.x, y: NG.connecting.my || p0.y };
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M' + p0.x + ',' + p0.y + ' L' + p1.x + ',' + p1.y);
      path.setAttribute('stroke', 'rgba(238,187,85,.6)');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-dasharray', '4,3');
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
    }
  },

  compile: function () {
    // Topological sort and build equation string
    let outNode = null;
    Object.values(NG.nodes).forEach(function (n) { if (n.type === 'output') outNode = n; });
    if (!outNode) return null;
    const varMap = {};
    let varCounter = 0;

    function evalNode(nid) {
      if (varMap[nid]) return varMap[nid];
      const node = NG.nodes[nid]; if (!node) return '0';
      const def = NG.types[node.type];
      const p = node.params;

      function getInput(portName) {
        const conn = NG.connections.find(function (c) { return c.toId === nid && c.toPort === portName; });
        if (!conn) return '0';
        return evalNode(conn.fromId);
      }

      let expr;
      const scl = p.scale != null ? p.scale : 1.0;
      switch (node.type) {
        case 'fbm':
          expr = 'fbm(x*' + scl.toFixed(2) + ',y*' + scl.toFixed(2) + ',' + (0 | p.oct) + ',' + p.rough.toFixed(2) + ')';
          break;
        case 'ridge':
          expr = 'ridge(x*' + scl.toFixed(2) + ',y*' + scl.toFixed(2) + ')';
          break;
        case 'warp':
          expr = 'warp(x*' + scl.toFixed(2) + ',y*' + scl.toFixed(2) + ',' + (p.strength || 0.8).toFixed(2) + ')';
          break;
        case 'island':
          expr = 'island(x,y,' + (p.radius || 3.5).toFixed(1) + ')';
          break;
        case 'canyon': expr = 'canyon(x,y)'; break;
        case 'volcano': expr = 'volcano(x,y)'; break;
        case 'mesa': expr = 'mesa(x,y)'; break;
        case 'add':
          expr = '(' + getInput('a') + ')+(' + getInput('b') + ')';
          break;
        case 'multiply':
          expr = '(' + getInput('a') + ')*(' + getInput('b') + ')' + (p.k && p.k !== 1 ? '*' + p.k.toFixed(2) : '');
          break;
        case 'subtract':
          expr = '(' + getInput('a') + ')-(' + getInput('b') + ')';
          break;
        case 'scale':
          expr = '(' + getInput('a') + ')*' + (p.k || 1.5).toFixed(2);
          break;
        case 'offset':
          expr = '(' + getInput('a') + ')+' + (p.k || 0.5).toFixed(2);
          break;
        case 'output':
          return evalNode((NG.connections.find(function (c) { return c.toId === nid && c.toPort === 'h'; }) || { fromId: null }).fromId || '');
        default:
          expr = '0';
      }
      varMap[nid] = expr;
      return expr;
    }

    const eq = evalNode(outNode.id);
    return eq && eq !== '0' ? eq : null;
  }
};

// Global mouse handlers for node dragging
document.addEventListener('mousemove', function (e) {
  if (NG.dragging) {
    const node = NG.nodes[NG.dragging.id];
    if (node) {
      node.x = e.clientX - NG.dragging.ox;
      node.y = e.clientY - NG.dragging.oy;
      const el = $('ngn-' + NG.dragging.id);
      if (el) { el.style.left = node.x + 'px'; el.style.top = node.y + 'px'; }
      NG.renderEdges();
    }
  }
  if (NG.connecting) {
    const wrapR = $('ng-canvas-wrap');
    if (wrapR) {
      const r = wrapR.getBoundingClientRect();
      NG.connecting.mx = e.clientX - r.left;
      NG.connecting.my = e.clientY - r.top;
      NG.renderEdges();
    }
  }
});
document.addEventListener('mouseup', function () { NG.dragging = null; });
