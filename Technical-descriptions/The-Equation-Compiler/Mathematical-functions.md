# TerrainForge Pro — Equation Functions: Mathematical Foundation

TerrainForge Pro uses mathematical functions to define procedural terrain. Instead of manually defining every terrain height, the system evaluates an equation at different coordinates to generate a height field.

The basic form is:

`h(x, y, t)`

Where:

- `x` — world-space X coordinate
- `y` — world-space Y coordinate
- `t` — time

For static terrain, `t` can remain constant. For dynamic systems such as water or waves, `t` can change over time.

## Mathematical Functions

The equation system supports a set of standard mathematical functions that can be combined with TerrainForge's procedural functions.

### Basic Functions

- `sin(x)` — sine
- `cos(x)` — cosine
- `tan(x)` — tangent
- `abs(x)` — absolute value
- `sqrt(x)` — square root
- `pow(x, n)` — power
- `floor(x)` — floor
- `ceil(x)` — ceiling
- `round(x)` — rounding
- `min(a, b)` — minimum
- `max(a, b)` — maximum
- `log(x)` — logarithm
- `exp(x)` — exponential

### Mathematical Constant

- `PI` — mathematical constant π

## Procedural Terrain Functions

TerrainForge also provides functions specifically intended for procedural terrain generation.

- `noise(x, y)`
- `fbm(x, y, octaves, roughness)`
- `ridge(x, y)`
- `billow(x, y, octaves, roughness)`
- `voronoi(x, y, jitter)`
- `warp(x, y, strength)`
- `dist(x, y, cx, cy)`
- `smoothstep(...)`

These functions can be combined with standard mathematical functions to create more complex terrain.

## Simplex Noise

`noise(x, y)` produces a smoothly varying procedural noise field.

Unlike completely random values, nearby coordinates produce related values. This makes it suitable for generating continuous terrain rather than isolated random points.

## Fractal Brownian Motion

`fbm()` combines multiple layers of noise at different scales.

Conceptually:

Large-scale terrain  
+  
Medium-scale detail  
+  
Small-scale detail  
+  
Fine detail

This produces more complex terrain than using a single noise layer.

Example:

`fbm(x, y, 6)`

## Ridge Noise

`ridge(x, y)` transforms the noise field to emphasise ridge-like structures.

It is particularly useful for creating sharper mountain and ridge formations.

## Billow Noise

`billow()` uses multiple noise layers with an absolute-value transformation.

This produces softer and more rounded terrain structures.

## Domain Warping

`warp()` modifies the coordinates before evaluating the procedural field.

This helps distort regular noise patterns and produces less uniform terrain.

## Distance Function

`dist()` calculates the distance between a point and a specified centre.

Conceptually:

`sqrt((x - cx)^2 + (y - cy)^2)`

This can be used to create radial or circular terrain features.

## Voronoi Noise

`voronoi()` generates a cellular-style procedural pattern based on distances to feature points.

It can be useful for creating more geometric or region-like terrain structures.

## Example

A terrain equation can combine multiple mathematical functions:

`fbm(x, y, 6) * 3 + ridge(x, y) * 1.5`

Here, the fBm component provides multi-scale terrain variation while the ridge component adds additional mountain-like structure.

The important idea is that TerrainForge treats terrain as a mathematical field that can be evaluated across space rather than as a collection of manually created heights.

## Why TerrainForge Does Not Use `eval()`

TerrainForge does not use JavaScript's `eval()` to execute equations.

Instead, the equation compiler uses `new Function()` and explicitly provides the mathematical and procedural functions available to the equation.

This gives the equation a defined set of mathematical tools such as:

- `sin()`
- `cos()`
- `sqrt()`
- `pow()`
- `fbm()`
- `ridge()`
- `noise()`
- `warp()`

The reason for avoiding an `eval()`-based approach is to keep the equation system separate from the surrounding JavaScript scope and avoid relying on techniques such as `with()` for injecting mathematical functions.

It is important to note that `new Function()` is still dynamic JavaScript compilation. Therefore, it should not be described as a complete security sandbox. It is the compilation mechanism used to turn TerrainForge's equation into a callable function with explicitly supplied mathematical helpers.
