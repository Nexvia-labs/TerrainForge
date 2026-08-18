# Chapter 3 — Heightmap Generation: Mathematical Foundation

## 3.1 Overview

TerrainForge generates terrain by constructing a mathematical height field.

Instead of manually placing every vertex of a terrain mesh, TerrainForge evaluates a mathematical function at different horizontal coordinates and uses the resulting value as the terrain height.

The basic representation is:

$$
H(x,y)
$$

where:

- $x$ = horizontal position along the terrain X-axis
- $y$ = horizontal position along the terrain Y-axis
- $H(x,y)$ = calculated terrain elevation at that position

The height field is then sampled across the terrain grid.

Each sampled value becomes a height value that can later be used to construct the 3D terrain surface.

For dynamic systems, TerrainForge can also use time as an additional variable:

$$
H(x,y,t)
$$

where $t$ represents time.

For ordinary static terrain generation, $t$ can remain fixed.

---

## 3.2 Heightmap as a Discrete Mathematical Field

A mathematical height function is continuous in concept, but a computer cannot evaluate infinitely many points.

TerrainForge therefore samples the function on a finite grid.

For a grid resolution of $R$:

$$
x_i = x_{\min} + i\Delta x
$$

$$
y_j = y_{\min} + j\Delta y
$$

where:

$$
0 \leq i,j < R
$$

The spacing is:

$$
\Delta x = \frac{x_{\max}-x_{\min}}{R-1}
$$

and:

$$
\Delta y = \frac{y_{\max}-y_{\min}}{R-1}
$$

The resulting heightmap is therefore a two-dimensional array:

$$
H_{i,j}=H(x_i,y_j)
$$

Every element of this array represents one sampled terrain elevation.

---

## 3.3 Procedural Noise

Pure mathematical functions such as:

$$
H(x,y)=\sin(x)+\cos(y)
$$

can create predictable patterns, but natural terrain usually requires irregular variation.

TerrainForge therefore uses procedural noise functions to create smoothly varying pseudo-random terrain structure.

The important property is spatial continuity.

Nearby coordinates should generally produce related values:

$$
(x_1,y_1)\approx(x_2,y_2)
\Rightarrow
N(x_1,y_1)\approx N(x_2,y_2)
$$

This produces smooth terrain instead of independent random spikes.

The procedural noise function can be represented as:

$$
N(x,y)
$$

where $N$ returns a deterministic value for a given coordinate.

Because the noise is deterministic, the same coordinate and seed can reproduce the same value.

---

## 3.4 Fractal Brownian Motion

TerrainForge uses fractal Brownian motion (fBm) to combine noise at multiple spatial frequencies.

A simplified representation is:

$$
fBm(x,y)=\sum_{i=0}^{n-1}a_iN(x_i,y_i)
$$

The coordinate frequency increases between octaves:

$$
x_i=x\cdot\lambda^i
$$

$$
y_i=y\cdot\lambda^i
$$

while the amplitude normally decreases:

$$
a_i=A\cdot r^i
$$

where:

- $n$ = number of octaves
- $A$ = initial amplitude
- $r$ = roughness/amplitude multiplier
- $\lambda$ = frequency/lacunarity multiplier
- $N$ = base noise function

Conceptually:

$$
\text{Terrain}
=
\text{large-scale structure}
+
\text{medium-scale detail}
+
\text{small-scale detail}
+
\text{fine detail}
$$

This allows TerrainForge to create terrain that contains both broad geographical shapes and smaller surface variation.

---

## 3.5 Octaves

An octave represents one layer of procedural noise.

The first octave generally contributes large-scale variation.

Later octaves contribute increasingly fine detail.

For example:

```text
Octave 1 → large mountains and broad elevation changes
Octave 2 → medium terrain structures
Octave 3 → smaller hills and valleys
Octave 4 → fine surface variation
Octave 5+ → increasingly fine detail
````
Increasing the octave count therefore increases the amount of detail evaluated by the height function.

However, additional octaves also increase computational work.

---

## 3.6 Roughness

The roughness parameter controls how strongly successive octaves contribute to the final height.

A simplified amplitude relationship is:

$$
A_{i+1}=A_i r
$$

where $r$ is the roughness factor.

A larger roughness value keeps more energy in higher-frequency layers.

A smaller value causes fine details to contribute less to the final terrain.

Therefore, roughness influences the visual character of the terrain as well as the distribution of detail across spatial scales.

---

## 3.7 Ridge Transformation

TerrainForge can transform noise into ridge-like structures.

A common mathematical transformation is based on the absolute value of the noise:

$$
R(x,y)=1-|N(x,y)|
$$

This converts valleys of the original noise field into ridge-like structures.

Additional shaping can then be applied:

$$
R'(x,y)=R(x,y)^p
$$

where $p$ controls the sharpness of the ridge.

The result can produce terrain with stronger mountain-ridge characteristics than ordinary noise.

---

## 3.8 Billow Transformation

Billow terrain is created by folding the noise field around zero.

A simplified transformation is:

$$
B(x,y)=|N(x,y)|
$$

The absolute-value operation converts negative noise values into positive values.

This creates rounded, cloud-like or hill-like terrain structures.

The resulting field can then be combined with additional octaves or scaling functions.

---

## 3.9 Domain Warping

TerrainForge can modify the coordinates supplied to a noise function before evaluating the terrain.

Instead of:

$$
N(x,y)
$$

the system can evaluate:

$$
N(x+w_x(x,y),y+w_y(x,y))
$$

where:

- $w_x$ = X-coordinate displacement
- $w_y$ = Y-coordinate displacement

This is known as domain warping.

The purpose is to distort the input space before sampling the underlying noise.

This can transform regular-looking noise patterns into more complex terrain structures such as:

- winding ridges
- stretched valleys
- irregular mountain systems
- distorted geological formations

A simplified warped coordinate can be written as:

$$
x'=x+sW_x(x,y)
$$

$$
y'=y+sW_y(x,y)
$$

where $s$ controls warp strength.

---

## 3.10 Voronoi-Based Structure

TerrainForge can also use Voronoi-style spatial partitioning.

Given a set of feature points $P_k$, the distance to the nearest point can be represented as:

$$
D(x,y)=\min_k d((x,y),P_k)
$$

with Euclidean distance:

$d((x,y),P_k) = \sqrt{(x-p_{kx})^2+(y-p_{ky})^2}$
Voronoi-style fields can introduce large-scale cellular or geological structures into the height field.

A jitter parameter can modify the distribution of feature points so that the resulting pattern is less perfectly regular.

---

aN_1(x,y)
+
bN_2(x,y)
+
cM(x,y)
$$

where:

- $N_1$ = primary terrain structure
- $N_2$ = secondary detail
- $M$ = terrain mask
- $a,b,c$ = contribution weights

This allows one mathematical expression to control the complete elevation field.

---

$$
S_1=S_2
\quad\text{and}\quad
P_1=P_2
$$

then the generated height field should remain reproducible:

$$
H_1(x,y)=H_2(x,y)
$$

This property is important for map sharing, testing, debugging, and scientific benchmarking.

---

## 3.11 Distance-Based Terrain Features

A radial distance function can be represented as:

$$ d(x,y,c_x,c_y) = \sqrt{(x-c_x)^2+(y-c_y)^2} $$

where $(c_x,c_y)$ is a chosen center.

Distance functions can be used to create:

- islands
- circular depressions
- radial terrain masks
- mountain centers
- falloff regions

A normalized distance can be constructed as:

$$
d_n=
\frac{d-d_{\min}}
{d_{\max}-d_{\min}}
$$

and then used as a mask.

---

## 3.12 Smooth Interpolation

TerrainForge can use smooth interpolation functions to create gradual transitions.

A standard smoothstep function is:

$$
S(t)=t^2(3-2t)
$$

for:

$$
0\leq t\leq1
$$

The function produces a gradual transition between two values.

This is useful for terrain masks because abrupt transitions can create unnatural boundaries.

---

## 3.13 Combining Multiple Functions

The strength of the equation system comes from combining mathematical functions.

For example:

# H(x,y)=3fBm(x,y)+1.5R(x,y) 



---

## 3.14 Normalization

The raw mathematical result may not naturally fall inside the desired terrain-height range.

Suppose the generated values have:

$$
H_{\min}
$$

and:

$$
H_{\max}
$$

A normalized value can be calculated as:

$$
H_n=
\frac{H-H_{\min}}
{H_{\max}-H_{\min}}
$$

This maps the height field approximately into:

$$
0\leq H_n\leq1
$$

The normalized value can then be scaled to a desired terrain elevation:

$$ H_{\text{final}} = H_n \left( H_{\text{max,target}} - H_{\text{min,target}} \right) + H_{\text{min,target}} $$

Normalization is important because it separates the mathematical shape of the terrain from the final physical scale used by the renderer.

---

## 3.15 Seed and Determinism

Procedural terrain should be reproducible.

TerrainForge therefore uses deterministic procedural generation so that the same generation parameters can reproduce the same terrain.

A conceptual representation is:

$$
H(x,y)=F(x,y,S,P)
$$

where:

- $S$ = seed
- $P$ = generation parameters
- $F$ = terrain-generation function

If the seed and parameters remain unchanged:

$$
S_1=S_2
\quad\text{and}\quad
P_1=P_2
$$

then the generated height field should remain reproducible:

$$
H_1(x,y)=H_2(x,y)
$$

This property is important for map sharing, testing, debugging, and scientific benchmarking.

---

## 3.16 From Mathematical Height to Terrain Data

The final heightmap can be represented as:

$$
\mathbf{H} =
\left[
\begin{array}{cccc}
H_{0,0} & H_{0,1} & \cdots & H_{0,R-1} \\
H_{1,0} & H_{1,1} & \cdots & H_{1,R-1} \\
\vdots & \vdots & \ddots & \vdots \\
H_{R-1,0} & H_{R-1,1} & \cdots & H_{R-1,R-1}
\end{array}
\right]
$$

This matrix is the mathematical representation of the terrain surface before it is converted into the final 3D geometry.

The next stage is to use these height samples to construct the terrain mesh.

---

## 3.17 Summary

TerrainForge's heightmap generation can therefore be understood as a sequence of mathematical operations:

$$
\text{Coordinates}
\rightarrow
\text{Noise}
\rightarrow
\text{Multi-Octave Combination}
\rightarrow
\text{Terrain Shaping}
\rightarrow
\text{Masking/Warping}
\rightarrow
\text{Normalization}
\rightarrow
\text{Heightmap}
$$

The important idea is that the terrain is not manually drawn.

It is calculated.

Each point of the terrain receives its elevation from the mathematical function, and the complete collection of sampled values forms the heightmap used by the 3D terrain system.
