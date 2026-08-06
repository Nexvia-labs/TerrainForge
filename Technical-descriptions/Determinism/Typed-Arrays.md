# Deterministic Terrain Storage with Typed Arrays

## Why Typed Arrays?

One of the biggest challenges while developing TerrainForge was storing terrain information efficiently.

Initially, terrain data was stored using normal JavaScript arrays. While functional, they introduced unnecessary memory overhead because every value is stored as a JavaScript object rather than raw binary data.

As terrain resolution increased, this approach became inefficient for both memory usage and runtime performance.

To solve this, TerrainForge uses **Typed Arrays**, allowing terrain data to be stored directly as compact binary values inside contiguous blocks of memory.

This provides:

- Lower memory consumption
- Faster sequential access
- Better CPU cache utilisation
- Reduced garbage collection
- Predictable memory allocation

Typed Arrays form one of the core components of TerrainForge's deterministic terrain engine.

---

# Uint8Array

`Uint8Array` stores **unsigned 8-bit integers**.

Each element occupies exactly **1 byte** and can store values between:

```
0 → 255
```

Because terrain data often consists of relatively small values, `Uint8Array` is ideal for storing:

- Height maps
- Biome IDs
- Brush masks
- Material IDs
- Binary flags
- Terrain classification values

Using only one byte per value makes it extremely memory efficient.

For example,

```
Terrain Resolution
256 × 256

Vertices
65,536

Memory Required

65,536 Bytes

≈ 64 KB
```

A normal JavaScript array would consume significantly more memory for the same data.

---

# Uint32Array

Some information cannot be represented using only one byte.

For larger numerical values, TerrainForge uses `Uint32Array`.

Each element occupies exactly **4 bytes** and stores unsigned integers between

```
0 → 4,294,967,295
```

TerrainForge uses `Uint32Array` for data such as:

- Chunk identifiers
- Packed metadata
- Deterministic seeds
- Lookup table indices
- Hash values
- Large procedural generation parameters

Although it consumes more memory than `Uint8Array`, it allows the engine to efficiently store much larger values while maintaining deterministic behaviour.

---

# Why Not Normal Arrays?

A normal JavaScript array stores generic JavaScript values.

Each element carries additional metadata managed by the JavaScript engine.

For large procedural worlds, this results in:

- Higher RAM usage
- Slower iteration
- Increased garbage collection
- Less predictable performance

Typed Arrays avoid these problems by storing raw binary values directly inside continuous memory.

This makes terrain generation significantly more efficient.

---

# Role in TerrainForge

Typed Arrays are used throughout TerrainForge to improve both performance and determinism.

Every terrain generation step operates directly on compact binary buffers rather than heavyweight JavaScript objects.

This approach enables:

- Faster terrain generation
- Faster terrain editing
- Lower memory usage
- Better scalability
- Stable runtime behaviour on low-end Android devices

Because the underlying data representation is fixed and deterministic, identical terrain data always produces identical computational results across supported platforms.

---

# Design Philosophy

Procedural terrain generation is not only about algorithms.

It is equally about how the generated data is represented in memory.

TerrainForge therefore combines deterministic algorithms with deterministic data structures.

Using Typed Arrays ensures that terrain remains:

- Compact
- Predictable
- Efficient
- Portable
- Scalable

This binary-first design is one of the key architectural decisions that allows TerrainForge to generate large procedural worlds while remaining performant even on resource-constrained devices.

---

# Summary

TerrainForge uses Typed Arrays as the foundation of its terrain storage system.

- **Uint8Array** stores compact terrain information using only one byte per value.
- **Uint32Array** stores larger deterministic values such as seeds, identifiers, and metadata.

Together, these structures significantly reduce memory consumption while improving runtime performance, making deterministic procedural terrain generation practical across a wide range of Android hardware.
