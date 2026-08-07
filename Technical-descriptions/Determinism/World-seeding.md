# Determinism III — Seed Propagation & Deterministic Hashing

## Why One Seed Is Not Enough

At first glance, generating a procedural world seems simple.

Give the engine a seed.

Generate the terrain.

Done.

However, TerrainForge quickly outgrew this idea.

A modern procedural terrain engine contains many independent systems:

- Terrain generation
- Erosion simulation
- Water animation
- Vegetation placement
- Rock scattering
- Future biome generation
- Future structure generation

If every system directly used the same seed, they would all begin producing correlated patterns.

The result would be predictable and visually repetitive terrain.

To avoid this, TerrainForge propagates the original world seed into multiple independent deterministic seeds.

---

# Seed Propagation

The user only provides a single seed.

For example,

```
Seed = 812945
```

Internally, TerrainForge derives additional seeds for each procedural subsystem.

Example:

```
World Seed
      │
      ├──────── Terrain Seed
      ├──────── Erosion Seed
      ├──────── Water Seed
      ├──────── Vegetation Seed
      └──────── Future Systems
```

Every subsystem receives its own deterministic random sequence while still remaining completely reproducible.

This ensures that changing one subsystem does not unintentionally affect another.

---

# Deterministic Hashing

Simply adding numbers to a seed is usually not sufficient.

Instead, TerrainForge derives new seeds using deterministic hashing techniques.

Hashing converts an input value into another numerical value while maintaining consistency.

For example,

```
World Seed

↓

Hash(World Seed + "Terrain")

↓

Terrain Seed
```

Likewise,

```
World Seed

↓

Hash(World Seed + "Water")

↓

Water Seed
```

Every subsystem receives a unique seed without breaking reproducibility.

---

# Why Hashing Is Important

Imagine erosion and terrain generation sharing exactly the same random sequence.

The erosion algorithm might repeatedly create channels in identical locations simply because both systems are consuming identical random numbers.

TerrainForge avoids this problem entirely.

Each subsystem has its own independent deterministic random stream.

As a result,

- terrain generation remains reproducible,
- erosion remains reproducible,
- water animation remains reproducible,

while all three remain statistically independent.

---

# Benefits

Seed propagation provides several important advantages.

## Independent Simulation

Each procedural system behaves independently.

Improving one system does not unintentionally modify another.

---

## Perfect Reproducibility

The same world seed always recreates the same terrain.

Even years later.

Even on another device.

Even after restarting the application.

---

## Modular Architecture

Future procedural systems can be added easily.

For example,

```
World Seed

↓

Hash

↓

Cave Generator
```

or

```
World Seed

↓

Hash

↓

Tree Generator
```

No existing subsystem needs to change.

---

## Easier Debugging

Because every subsystem receives deterministic input, bugs become reproducible.

Instead of saying,

> "It happened randomly."

the developer can simply reuse the same seed and reproduce the exact behaviour.

This makes debugging significantly easier.

---

# Design Philosophy

TerrainForge treats randomness as a carefully managed resource.

Randomness should never be uncontrolled.

Instead, every random value should be:

- deterministic,
- reproducible,
- isolated,
- and predictable from its seed.

By propagating a single world seed into multiple independent deterministic streams, TerrainForge ensures that procedural generation remains scalable without sacrificing reproducibility.

---

# Summary

TerrainForge uses deterministic seed propagation to separate every procedural subsystem while preserving complete reproducibility.

Instead of relying on one shared random sequence, each system derives its own deterministic seed through hashing.

This architecture allows TerrainForge to grow into a larger procedural engine where new generators can be added without affecting existing terrain, making the engine both modular and mathematically consistent.
