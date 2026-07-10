<a id="top"></a>
<div align="center">

<img src="assets/banner.png" alt="TerrainForge-Lite banner" width="100%">

# ⛰️ TerrainForge‑Lite

### Procedural 3D Terrain Generator — Math, Noise & Node Graphs, in One HTML File

*Sculpt mountains, carve coastlines, paint biomes, and grow forests — entirely in your browser.*

[![Three.js](https://img.shields.io/badge/Three.js-r128-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#-tech-stack)
[![Build](https://img.shields.io/badge/Build-Zero%20Config-brightgreen?style=flat-square)](#-getting-started)
[![Format](https://img.shields.io/badge/Format-Single%20HTML%20File-orange?style=flat-square)](#-project-structure)
[![WebGL](https://img.shields.io/badge/WebGL-Required-red?style=flat-square)](#-requirements)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#-license)

</div>

<br>

> 📌 **Note:** This README references image assets under `assets/` (e.g. `assets/banner.png`, `assets/demo.gif`). Drop your own screenshots and recordings into that folder using the file names below and everything will render automatically — no other changes needed.

---

## 📚 Table of Contents

- [✨ Features](#-features)
- [🎬 Demo](#-demo)
- [📸 Screenshots](#-screenshots)
- [⚡ Node Compilation](#-node-compilation)
- [🎛 Control Panel](#-control-panel)
- [🚀 Getting Started](#-getting-started)
- [🧭 Usage Guide](#-usage-guide)
- [🧮 Writing Custom Equations](#-writing-custom-equations)
- [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
- [📦 Export Formats](#-export-formats)
- [🛠 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🧩 Requirements](#-requirements)
- [🗺 Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

---

## Overview

**TerrainForge‑Lite** is a self‑contained, single‑file terrain sandbox for building stylized 3D landscapes out of pure math. Type an equation, pick a preset, or wire together a visual node graph — the tool composites fBm noise, layered equations, height/slope‑based coloring, animated water, and instanced vegetation into a live Three.js scene, ready to export as a mesh or texture.

There's no install, no bundler, and no backend. Open the HTML file and you're generating terrain in seconds.

---

## ✨ Features

**🏔 Terrain Generation**
- fBm‑based procedural heightmaps with adjustable scale, amplitude, octaves, and roughness
- 10 built‑in presets — Mountain Range, Rolling Hills, High Plateau, Tropical Island, Canyon Lands, Volcano, Fjord Coast, Desert Mesa, Archipelago, Flat Plains
- Live equation editor for full manual control over the heightfield

**⚡ Visual Node Graph**
- Drag‑and‑drop node editor that compiles directly into the terrain equation
- 7 noise/shape sources, 5 math operators, and an output terminal

**📐 Mathematical Layers**
- Stack additional equations on top of the base heightmap
- Add / Multiply / Subtract / Replace blend modes per layer

**🎨 Splat‑Based Coloring**
- 7‑zone height‑and‑slope‑driven texture painting (deep water → snow)
- Live color pickers with instant vertex‑color preview

**🌊 Water & Rivers**
- Animated water plane with configurable sea level, wave height, and speed
- Domain‑warped procedural rivers carved directly into the heightmap

**🌿 Biome Population**
- Instanced tree and rock scattering driven by slope, height, and density controls
- Configurable snow line and forest bands

**🔑 Seed System**
- Shareable seed codes for reproducible maps
- Auto‑generated "Map DNA" card — complexity score, biome type, rarity, and a procedural map name

**📦 Multi‑format Export**
- PNG screenshot, textured OBJ, binary GLB, and an RGBA splatmap texture

**💾 Project Management**
- Save and reload maps locally via IndexedDB — no account or server required

---

## 🎬 Demo

<div align="center">
<img src="assets/demo.gif" alt="TerrainForge-Lite workflow demo" width="85%">

<sub>Generating a map end‑to‑end: preset → sliders → node graph → export.</sub>
</div>

---

## 📸 Screenshots

<table align="center">
<tr>
<td align="center"><img src="assets/results/mountain-range.png" width="360" alt="Mountain Range preset"><br><sub>🏔 Mountain Range</sub></td>
<td align="center"><img src="assets/results/tropical-island.png" width="360" alt="Tropical Island preset"><br><sub>🏝 Tropical Island</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/results/volcano.png" width="360" alt="Volcano preset"><br><sub>🌋 Volcano</sub></td>
<td align="center"><img src="assets/results/archipelago.png" width="360" alt="Archipelago preset"><br><sub>🏖 Archipelago</sub></td>
</tr>
</table>

---

## ⚡ Node Compilation

<div align="center">
<img src="assets/node-graph.png" alt="Visual node graph editor" width="80%">
</div>

The **Nodes** tab exposes a visual, graph‑based alternative to hand‑writing equations. Add nodes from the palette, drag them around the canvas, and connect ports to describe how noise sources combine — then hit **⚡ Compile → Equation** to convert the graph into the same equation string the Terrain tab uses.

| Category | Nodes |
|---|---|
| **Noise Sources** | FBM Noise · Ridge Noise · Domain Warp · Island Mask · Canyon · Volcano · Mesa |
| **Math Operations** | Add (A+B) · Multiply (A×B) · Subtract (A−B) · Scale (A×k) · Offset (A+k) |
| **Terminal** | ★ Output |

Because compilation just produces a normal equation string, graphs and hand‑written equations are fully interchangeable — build visually, then fine‑tune the text, or vice versa.

---

## 🎛 Control Panel

<div align="center">
<img src="assets/controller.png" alt="TerrainForge-Lite control panel" width="80%">
</div>

All authoring happens in the tabbed side panel:

| Tab | Purpose |
|---|---|
| 🏔 **Terrain** | Equation presets, scale/amplitude/octaves/roughness/resolution, viewport toggles |
| 🌊 **Water** | Sea level, wave height/speed, river carving (depth & warp strength) |
| 🌿 **Biomes** | Tree/rock density, snow line, forest bands, max slope for vegetation |
| 📐 **Layers** | Stack and blend additional equation layers |
| 🎨 **Color** | Per‑zone splat colors (deep water, shallow, sand, grass, forest, rock, snow) |
| ⚡ **Nodes** | Visual node graph editor (see [Node Compilation](#-node-compilation)) |
| 🔑 **Seed** | Seed / map‑code input, random seed, and the Map DNA summary card |

A live **stats readout** (Peak Height, Water Level, Tree/Rock Instances, Biome, Coverage) sits above the panel and updates every time you generate.

---

## 🚀 Getting Started

TerrainForge‑Lite has **zero dependencies to install** — it's one HTML file that pulls Three.js from a CDN at load time.

```bash
# 1. Clone or download the repo
git clone https://github.com/<your-username>/terrainforge-lite.git
cd terrainforge-lite

# 2. Open it directly...
open TerrainForge-lite.html          # macOS
start TerrainForge-lite.html         # Windows
xdg-open TerrainForge-lite.html      # Linux

# ...or serve it locally (recommended, for reliable IndexedDB save/load)
python3 -m http.server 8000
# then visit http://localhost:8000/TerrainForge-lite.html
```

That's it — no `npm install`, no build step, no config.

---

## 🧭 Usage Guide

1. **Pick a starting point** — choose a preset from the Terrain tab, or write your own equation
2. **Shape it** — tune scale, amplitude, octaves, and roughness
3. **(Optional) Build a node graph** — compose noise sources visually, then Compile → Equation
4. **Add layers** — stack extra equations with different blend modes for detail
5. **Paint biomes** — assign colors per height/slope zone in the Color tab
6. **Add water & rivers** — set sea level, enable rivers, tune warp and depth
7. **Populate it** — adjust tree/rock density and forest/snow bands
8. **Generate** — click **⚙ Generate** (or press `G`)
9. **Export or save** — download a PNG/OBJ/GLB/Splatmap, or save the map to revisit later

---

## 🧮 Writing Custom Equations

The Terrain and Layers equation fields accept a JavaScript‑like expression of `x`, `y`, and `t`, plus these helpers:

| Function | Signature | Description |
|---|---|---|
| `fbm` | `fbm(x, y, octaves, roughness)` | Fractal Brownian Motion — layered noise for natural detail |
| `ridge` | `ridge(x, y)` | Ridge noise for sharp mountain ridgelines |
| `noise` | `noise(x, y)` | Raw simplex noise |
| `dist` | `dist(x, y, cx, cy)` | Distance from point `(cx, cy)`, defaults to the origin |
| `warp` | `warp(x, y, strength)` | Domain‑warped noise for organic distortion |
| `island` | `island(x, y, radius)` | Radial island mask that falls off toward the edges |
| `canyon` | `canyon(x, y)` | Carved canyon formation |
| `volcano` | `volcano(x, y)` | Volcanic cone with a crater |
| `fjord` | `fjord(x, y)` | Fjord coastline shape |
| `mesa` | `mesa(x, y)` | Stepped desert mesa/plateau |
| `archipelago` | `archipelago(x, y)` | Scattered island chain |
| `plains` | `plains(x, y)` | Gentle, low‑relief plains |

Standard math (`sin`, `cos`, `tan`, `abs`, `sqrt`, `pow`, `floor`, `ceil`, `round`, `max`, `min`, `log`, `exp`, `PI`) is also available directly.

```js
// Example: a ridged island with rolling detail
island(x, y, 4) + ridge(x, y) * 0.6 + fbm(x, y, 5, 0.45) * 0.8
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Toggle auto‑rotate |
| `G` | Generate terrain |
| `H` | Show/hide the UI panel |
| `E` | Export PNG |
| `W` | Toggle wireframe |
| `Esc` | Blur the focused input field |

---

## 📦 Export Formats

| Format | Contents |
|---|---|
| **PNG** | Screenshot of the current viewport |
| **OBJ** | Textured mesh geometry for use in any 3D DCC tool |
| **GLB** | Binary glTF mesh — ready to drop into Unity, Unreal, Blender, or the web |
| **Splatmap** | RGBA weight texture — R = Sand, G = Grass/Forest, B = Rock, A = Snow — for use as a layer mask in URP/HDRP |

<div align="center">
<img src="assets/splatmap-export.png" alt="Exported RGBA splatmap example" width="45%">
</div>

---

## 🛠 Tech Stack

- **[Three.js r128](https://threejs.org/)** — WebGL rendering, scene graph, and geometry
- **Vanilla JavaScript** — no framework, no transpiler, no bundler
- **`MeshPhongMaterial` + per‑vertex colors** — for the splat‑painted terrain and water
- **IndexedDB** — local, serverless project persistence
- **Google Fonts** (Oxanium, JetBrains Mono) — UI typography

---

## 📁 Project Structure

```
terrainforge-lite/
├── TerrainForge-lite.html   # The entire application — markup, styles, and logic
├── assets/                  # README media (add your own screenshots/recordings here)
│   ├── banner.png
│   ├── demo.gif
│   ├── node-graph.png
│   ├── controller.png
│   ├── splatmap-export.png
│   └── results/
│       ├── mountain-range.png
│       ├── tropical-island.png
│       ├── volcano.png
│       └── archipelago.png
├── README.md
└── LICENSE
```

---

## 🧩 Requirements

- A modern, WebGL2‑capable browser (recent Chrome, Edge, Firefox, or Safari)
- Internet access on first load (to fetch Three.js and fonts from CDN)
- A desktop pointer (mouse) is recommended — touch controls for mobile aren't implemented yet

---

## 🗺 Roadmap

Ideas being explored for future versions:

- [ ] Touch/mobile camera & UI controls
- [ ] Custom texture painting (brush‑based, in addition to splat zones)
- [ ] Additional export targets (FBX, USDZ)
- [ ] Undo/redo history for the node graph and layers
- [ ] Cloud sync for saved maps (optional, alongside local IndexedDB storage)

Have a request? Open an issue — see [Contributing](#-contributing) below.

---

## 🤝 Contributing

Contributions, bug reports, and feature ideas are welcome.

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-idea`)
3. Commit your changes
4. Open a Pull Request describing what changed and why

Since everything lives in a single HTML file, please keep unrelated formatting/reflow changes out of feature PRs so diffs stay reviewable.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) for the rendering engine
- The Simplex noise algorithm, for making the noise sources possible
- [Google Fonts](https://fonts.google.com/) — Oxanium & JetBrains Mono

<div align="center">

<br>

**[⬆ Back to top](#top)**

</div>
