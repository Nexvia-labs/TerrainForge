# Determinism I — Seeded PRNG & Simplex Noise

## Why Determinism Matters

One of the core design principles behind TerrainForge is **determinism**.

Every terrain generated inside the engine should be perfectly reproducible.

If two users enter the same seed with the same generation settings, they should obtain **exactly the same world**, regardless of device, browser, or operating system.

This behaviour forms the foundation for:

- Map Codes
- World Sharing
- Fork Variant
- Reproducible Terrain Generation

Without determinism, none of these features would be reliable.

---

## Seeded Simplex Noise

TerrainForge generates its terrain using **Simplex Noise**, a coherent gradient noise algorithm commonly used in procedural generation.

Unlike completely random values, Simplex Noise produces smooth continuous variations, making it ideal for creating realistic landscapes such as mountains, valleys, cliffs, dunes, and hills.

However, standard implementations often depend on `Math.random()`, which cannot be seeded in JavaScript.

To solve this problem, TerrainForge builds its own **seeded permutation table** during initialization.

Instead of relying on unpredictable random values, the permutation table is shuffled using a deterministic pseudo-random generator.

As a result:

- identical seeds always create identical permutation tables,
- identical permutation tables always produce identical noise,
- and identical noise always generates identical terrain.

This makes procedural generation completely reproducible.

---

## Seeded Pseudo-Random Number Generator (PRNG)

TerrainForge uses a lightweight **Linear Congruential Generator (LCG)** as its pseudo-random number generator.

Instead of generating unpredictable values like `Math.random()`, the generator follows a deterministic mathematical recurrence.

Each newly generated value depends entirely on the previous one.

Because the initial seed is fixed, the entire sequence of numbers becomes fixed as well.

In practical terms:

```
Same Seed
      ↓
Same Random Sequence
      ↓
Same Noise Field
      ↓
Same Terrain
```

This guarantees that procedural generation behaves consistently across every execution.

---

## Why Not Use Math.random()?

JavaScript's built-in random generator cannot be seeded.

This means two users generating terrain with identical parameters could receive completely different landscapes.

For a procedural terrain engine, that behaviour is unacceptable.

TerrainForge therefore replaces non-deterministic randomness with a reproducible PRNG.

This ensures that every generated world can be recreated years later simply by storing its seed.

---

## Separation of Random Systems

TerrainForge intentionally separates different sources of randomness.

The seeded Simplex Noise is responsible for generating **spatial structure**:

- terrain elevation
- mountain placement
- valleys
- landforms

Meanwhile, the seeded PRNG provides independent random values for systems such as:

- hydraulic erosion droplet spawning
- stochastic simulation events
- procedural sampling

Keeping these systems independent prevents hidden correlations between terrain generation and simulation behaviour.

For example, erosion droplets should not repeatedly appear because of the terrain noise pattern itself.

To avoid this, TerrainForge offsets the simulation seed internally, producing an independent deterministic random stream while still remaining fully reproducible.

---

## Design Philosophy

Determinism is more than a technical implementation.

It transforms procedural generation into something that can be:

- shared,
- reproduced,
- debugged,
- versioned,
- and collaboratively explored.

A terrain is no longer just randomly generated.

It becomes a reproducible computational artifact that can be recreated exactly whenever required.

---

## Summary

TerrainForge achieves deterministic procedural generation through two cooperating systems:

- **Seeded Simplex Noise** for coherent spatial terrain generation.
- **Seeded Linear Congruential Generator (LCG)** for reproducible pseudo-random behaviour.

Together, they ensure that every generated terrain remains mathematically consistent, portable, and reproducible across every supported platform.
