I'll review the uncommitted Session A changes against the Phase 1.5 brief by reading the spec and the listed files only.A1's exit callback, A6's glow ranges, A8's debug hooks, and full-world physics bounds match the brief. The grounding, decals, witch, and a few A2 layout items do not.

## 1. Bugs and unmet spec

**Critical — wizard origin is overwritten every frame, so the bob never happens.** `src/scenes/GraveyardWorld.ts:766` and `:774` assign `displayOriginY = 61/64` (~0.95). That property is in pixels, so this pins the origin about 1 px from the top of the 64 px frame and undoes `setOrigin(0.5, 61/64)` from `:434` on the first idle update. Feet, physics, and depth then disagree by ~60 px, and the ±1 px term is sub-pixel. Set `displayOriginY = 61 - bobOffset` while moving and `61` while idle. Keep `setOffset(20, 45)` so a 16 px body ends on that boot line (`46` leaves the feet 1 px low).

**High — ground decals never spawn.** `src/scenes/GraveyardWorld.ts:231-242`: the loop condition includes `attempts < 50`, so it always runs at least 50 times, then `if (attempts >= 50) continue` drops every decal. There is also no upper bound, so a hard-to-place decal keeps searching. Draw until a spot is valid or 50 attempts fail, and place only when valid.

**High — grave mounds never spawn.** `spawnGraveMounds` (`:177`) and `spawnGroundDecals` (`:200`) run at `:104-105`, before `buildTombstones()` at `:106`. Both walk `this.tombstones`, which is still empty, so the 24 px grave exclusion never runs either. Call `buildTombstones()` first.

**High — witch has no loaded art or audio.** `WitchFlyBy.ts:102` and `:112` use `witch_broom`, `witch_cackle`, and `witch_cackle_2`. `worldAssets.ts` never queues them (only shadows and decals, `:132-145`). The files are already under `public/assets/images/eggs/` and `public/assets/audio/sfx/`. Queue the image and both sounds as `[ogg, mp3]` in `queueWorldAssets`.

**High — contact and cast shadows are the wrong shape and sit below the sprite.** `Tombstone.ts:38-48`, `GraveyardWorld.ts:359-368` (pumpkins), `:398-407` (trees), `:453-469` and `:703-710` (wizard). `setScale(n)` scales both axes, and origin `(0.5, 0)` at `y + 8` starts the ellipse 8 px under the feet. A resurrectable stone becomes about 73×27 instead of ~80×9. Tree cast becomes ~59×25 at `y + 14` instead of 130×36 at `(+30, +6)`. Use non-uniform scale and a centered origin:

- Contact: `setScale(1.1 * footprint / 64, 9 / 24)`, `setOrigin(0.5, 0.5)`, center at `y - 1`, alpha 0.6 (wizard 28×8, alpha 0.65; trees 44×10).
- Cast: `setScale(1.3 * footprint / 96, …)`, origin centered, offset `(+0.25 * width, +3)`, depth `y - 2`. Trees: `setScale(130/96, 36/40)` at `(x + 30, y + 6)`, alpha 0.25.

**Medium — witch flies backwards.** `witch_broom` faces right. `WitchFlyBy.ts:106` does `setFlipX(goRight)`, which mirrors her while she flies right. Use `setFlipX(!goRight)`.

**Medium — witch depth 60 draws her under the world.** Trees, stones, and the wizard use `setDepth(y)` (about 250–2200). Depth 60 (`WitchFlyBy.ts:103`) is above the fog tiles (depth 5–7) and under almost every sprite, so canopies cover the fly-by. Fog cannot stay at 5–7 and also sit above her. Set her depth above world sort (for example 3000). The HUD is a different scene, so it still draws on top.

**Medium — A2 path strips and the 16 px edge margin are missing.** `mapLayout.ts:88` has no 32 px strips at y≈440, 740, and 1135 for x 340–1120 and 1380–2140, and no moonlit-clearing link (x 1000–1176 at y≈1680, plus x≈1176 from y 1600–1700). The south spine ends at y 1650 (`:98`). `GraveyardWorld.ts:95` uses `setBounds(0, 0, WORLD_W, WORLD_H)`. Inset the physics bounds by 16 px on each side; leave the camera bounds at `:479` on the full world.

**Medium — decals are not the seeded layout from A3.** Positions, scale, and alpha use `Phaser.Math.Between` / `FloatBetween` (`GraveyardWorld.ts:232-246`), not `mulberry32(1031)`. Mushrooms are 6 random images (`:211`) instead of 1–2 beside about half the trees. Roots are under every trunk (`:411`) but at depth `y - 2` with an unseeded scale; A3 says depth `tree.y - 3` and scale 0.9–1.2 from the seeded RNG. Drive placement, scale, flip, and tint from that RNG only.

**Medium — a crow can launch during the witch.** `WitchFlyBy` checks `isCrowActive` (`GraveyardWorld.ts:121`), but `updateCrow` (`:863`) never checks `this.witch.isActive`. Skip the crow spawn while the witch is in flight.

**Low — one trunk gap is under 36 px.** The plaza tree at `GraveyardWorld.ts:313` `(1530, 800)` and `unmarked-grave` at `mapLayout.ts:21` `(1500, 760)`: trunk AABB top is y≈790, stone body bottom y≈764, and they overlap in x by ~4 px, leaving a 26 px gap. Nudge that tree east or north so the gap is at least 36 px. Other grave approaches stay open. `spawnTree` (`:418-423`) uses one 18×10 box on the sprite center for every texture. `tree_4` has a thick centered trunk, so the wizard overlaps the painted trunk. Size `tree_3` and `tree_4` from the opaque pixels in the bottom rows.

**Low — button `touch-action` does not win.** `GraveOverlay.ts:188-232` correctly calls `onExitCallback` once, and `pointer-events: all` is on the overlay and panel. `touch-action: manipulation` on the button (`:178`) has no effect because `index.html:39` sets `touch-action: none` on `html, body`, and a descendant cannot relax that. While the overlay is open, set `touch-action: manipulation` on `body`.

A6 matches the brief: glow alpha 0.16→0.32, base 0.2, scale 0.31→0.335 (`Tombstone.ts:65-73`). A8's `teleport`, `spawnWitch`, and `world()` are gated by dev or `?debug` (`main.ts:44-109`).

## 2. Performance

With the spawn bugs fixed, the scene adds about 282 decals, ~29 mounds, 34 root decals, and ~168 static shadows (34 trees, 40 stones, 10 pumpkins, two each), on top of the sprites. That is well over A3's 300-object line, and nothing is baked into a `RenderTexture`. Camera culling still walks the full list every frame. Bake the static ground decals, mounds, roots, and prop shadows once in `create`. The wizard's two shadows have to stay live. The 74 static trunk and stone bodies are cheap. The decal search, once it has a real cap, is create-time only.

## 3. Floating and blocked graves

- The per-frame origin write lifts the wizard's sort point to his hat while the art and the 16 px body hang ~60 px lower. His shadow follows `wizard.y + 8` (`:705`), so it sits on the torso. Depth `setDepth(wizard.y)` (`:792`) sorts him behind stones he is standing in front of.
- Every contact shadow starts 8 px below the sprite and is too tall, so stones, trees, pumpkins, and the wizard show a gap above a blob. Tree and stone art already include a base shadow, which makes the second ellipse read as a second, lower shadow.
- No mounds spawn, so resurrectable graves have no dirt plot at `(x, y + 16)`.
- Nothing hard-blocks a grave. The only tight collider is the 26 px gap at unmarked-grave / the tree at `(1530, 800)`. Wide `tree_3` / `tree_4` trunks are visually solid where the 18 px body is not.
