### The Engineering Decision Behind TerrainForge Development

**Why I Didn't Use Firebase ?**

When I first started building TerrainForge, my initial idea for world sharing was to use Firebase. It seemed like the obvious solution. Every generated world could be uploaded to a database, and users would simply receive a unique world ID to share with others.

<img src="..assets/Journey-of-Development" alt="Firebase-Image" width="100%">
As development continued, I realized that this approach conflicted with one of TerrainForge's core principles.

----

```TerrainForge should remain as offline as possible.```

-----

Relying on a cloud database would mean users would always need an internet connection to upload, download, or even access shared worlds. It would also introduce server costs, database management, maintenance, and dependence on external services. While Firebase is an excellent platform, it didn't align with the long-term vision I had for TerrainForge.

So I decided to redesign the entire world-sharing system instead of compromising the project's philosophy.

---

### The Engineering Decision

_Instead of storing worlds on an online database, TerrainForge now stores only the parameters that generated the world._

_Every terrain is created from deterministic values such as the seed, terrain configuration, noise parameters, biome settings, and other generation options. These values are encoded into a compact string that can be shared directly through the browser._

_Internally, the system reconstructs the exact same world by decoding these parameters and feeding them back into the deterministic generation pipeline._

_Because the generation algorithm always produces the same output for the same inputs, two users with the same code obtain the exact same terrain—without downloading any world file from the internet._

-----

<img src="..assets/Journey-of-Development" alt="Seed-LCG-Image" width="100%">

----

### The Result

This decision allowed TerrainForge to preserve its original philosophy.

- No online database is required.
- No world files are uploaded to external servers.
- No cloud storage costs.
- No dependency on internet connectivity for world reconstruction.
- The same terrain can be recreated anywhere simply by sharing a compact code.

Instead of storing worlds, TerrainForge stores the instructions needed to recreate them.

Looking back, choosing a deterministic parameter-based sharing system over Firebase required more engineering effort, but it resulted in a design that is simpler, more scalable, and fully aligned with TerrainForge's goal of remaining an offline-first terrain generation platform.



### Lesson Learned

Building software is not only about choosing what is technically possible—it is about choosing what best serves the product's/portfolio's vision. During TerrainForge's development, I learned that convenience should never outweigh core principles. Replacing a cloud-based solution with a deterministic offline system required more effort, but it resulted in a design that is simpler, independent, and true to the project's philosophy. Every engineering decision should strengthen the product's identity, not compromise it.
