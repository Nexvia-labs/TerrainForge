# TerrainForge Pro — Equation Compiler

## How the Equation Compiler Works

TerrainForge allows the user to type mathematical equations directly for generating terrain. For example:

```text
fbm(x,y,6)*3 + ridge(x,y)*1.5
```

This equation is initially just a **text string**. TerrainForge needs to convert this text into something that JavaScript can repeatedly calculate for every point of the terrain.

This job is handled by the `getEquationFn()` equation compiler.

### 1. User enters an equation

The user can enter an equation such as:

```text
fbm(x,y,6)*3 + ridge(x,y)*1.5
```

The Node Graph can also generate an equation string automatically. The same compiler can then process it.

The main variables available to the equation are:

- `x` — X coordinate of the terrain
- `y` — Y coordinate of the terrain
- `t` — time

For normal terrain generation, `t` is passed as `0`, because the terrain height is normally static.

### 2. The compiler creates a function

Instead of manually writing separate JavaScript code for every possible equation, TerrainForge dynamically creates a function using JavaScript's `new Function()`.

Conceptually, it becomes something like:

```text
function(x, y, t) {
    return fbm(x,y,6) * 3 + ridge(x,y) * 1.5;
}
```

This means the same compiler can handle many different equations without needing a separate function for each one.

### 3. Mathematical functions are provided directly

The compiler passes the supported mathematical functions into the generated function as named parameters.

For example:

```text
sin
cos
tan
abs
sqrt
pow
floor
ceil
round
max
min
log
exp
PI
```

TerrainForge's own procedural functions are also provided:

```text
fbm
ridge
noise
dist
warp
island
canyon
volcano
fjord
mesa
archipelago
plains
billow
voronoi
smoothstep
```

Because these are passed directly as parameters, the generated equation can call them without searching through the global JavaScript scope.

For example:

```text
sin(x*2) + fbm(x,y,5,0.5)*3
```

can combine normal mathematics with TerrainForge's procedural terrain functions.

### 4. Why not `eval()`?

TerrainForge does **not use `eval()`** for the equation system.

Instead, it uses `new Function()` to dynamically compile the equation.

The reason is mainly control over how the equation is constructed. The compiler explicitly provides the variables and helper functions that the equation can use instead of depending on the surrounding scope.

It also avoids using JavaScript's `with()` approach. `with()` is disallowed in strict mode and makes identifier lookup less predictable. By passing functions such as `sin`, `fbm`, and `ridge` as parameters, the generated function has explicit access to the functions it needs.

> **Important:** `new Function()` is still dynamic code execution. It should not be described as a completely safe replacement for `eval()` when accepting arbitrary untrusted input. In TerrainForge's current design, the equation compiler is intended for the application's own equation input system.

### 5. Error handling

The compiler has two levels of error protection.

The first `try/catch` handles **compile-time errors**.

For example, if the user enters an invalid expression, `new Function()` can fail. Instead of crashing TerrainForge, the compiler returns a fallback function that produces `0`.

The second `try/catch` handles **runtime errors** while the equation is being evaluated.

This is important because the equation can be evaluated thousands of times — once for every terrain cell.

If one calculation produces an invalid value or another runtime error, that calculation can fall back to `0` instead of stopping the complete terrain generation process.

### 6. From equation to terrain

After compilation, the returned function is called for every point in the terrain grid.

Conceptually:

```text
(x, y)
  ↓
Equation Compiler
  ↓
Compiled equation
  ↓
Height value
  ↓
Float32Array heightmap
  ↓
Erosion / rivers / mesh generation
```

The heightmap generation code evaluates the compiled equation using the terrain coordinates:

```text
h = equation(x, y, 0)
```

The resulting value becomes the height of that terrain location.

The generated height field can then be passed to later stages such as erosion, hydrology, mesh construction, and biome colouring.

### 7. Why compiling once matters

The equation is compiled when the heightmap is built rather than rebuilding the JavaScript function for every terrain cell.

So the process is roughly:

```text
Equation string
      ↓
Compile once
      ↓
Reusable function
      ↓
Call for every grid cell
```

This is much more practical than repeatedly compiling the equation for every coordinate.

The compiler therefore has a one-time compilation cost, while the resulting function can be reused across the entire heightmap generation process.

The procedural noise calculations called by the equation can still be computationally expensive because they may run many times across the terrain grid.

## Example

A user could enter:

```text
fbm(x,y,6,0.5)*3 + ridge(x,y)*1.5
```

TerrainForge converts that expression into a reusable function.

Then, for different terrain positions:

```text
(x1, y1) → height 1
(x2, y2) → height 2
(x3, y3) → height 3
...
```

Repeating this across the complete grid produces the initial procedural heightmap.

## Separate Compilers for Dynamic Systems

TerrainForge also has equation compilers for systems that behave differently from the normal terrain equation.

For example, the Chaos Engine's wave equation is time-dependent:

```text
W(x,y,t)
```

Unlike the normal terrain equation, its `t` value changes over time.

The Chaos Engine's compiler also calculates a radial distance:

```text
d = √(x² + y²)
```

This allows equations such as:

```text
sin(d*2.5 - t*1.8)*1.8
```

to create expanding circular wave patterns.

The separate compiler exists because normal terrain generation does not need this extra radial-distance calculation, while animated wave systems do.

## In Simple Words

The equation compiler is basically the **translator between the equation the user writes and the terrain engine**.

```text
User equation
      ↓
Equation Compiler
      ↓
JavaScript function
      ↓
Calculate height at every coordinate
      ↓
Heightmap
      ↓
Erosion + Rivers + Biomes + Mesh
      ↓
Final Terrain
```

So it doesn't need to manually write JavaScript code for terrain generation. They can write a mathematical expression, and TerrainForge converts that expression into something the engine can repeatedly calculate across the terrain.
