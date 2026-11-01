I'll verify each Round 2 item against the current `src/` files and look for new bugs the fixes may have introduced. Reading the review list and the diffed sources only.The review lists origin, decals, mounds, witch assets, shadows, and physics bounds. I'll check those sites in the current sources.**High — baked decals and mounds are destroyed and never shown.** `src/scenes/GraveyardWorld.ts:451` calls `this.make.renderTexture(..., false)`. In Phaser 3.90 that second argument sets `config.add` to false, so `BuildGameObject` does not put the texture on the display list. The loop at `:466` then draws every depth `-8` image into that orphan texture and `:471` destroys the originals. Grave mounds and the ground decals (tufts, dirt, pebbles, litter, the six mushrooms) disappear. Roots and prop shadows are not depth `-8`, so they stay as live sprites.

Fix: pass `true` (or `this.add.existing(rt)` after `setOrigin` / `setDepth`). Keep the texture at `(WORLD_W/2, WORLD_H/2)` with origin `(0.5, 0.5)` and depth `-8.5`. Also stamp roots (`depth === y - 3`) and tree, stone, and pumpkin shadows before destroying them. Leave the wizard's two shadows live.

**Medium — non-tree cast shadows are still ~36 px tall.** `src/ui/Tombstone.ts:54`, `src/scenes/GraveyardWorld.ts:372` (pumpkins), and `:517` (wizard) use `setScale(1.3 * footprint / 96, 36 / 40)`. That Y scale is the tree cast. On the wizard it is about 36×36, centered at `y + 3`, so it covers the legs. Tree cast at `:413` (`130/96`, `36/40`, offset `(+30, +6)`) is fine.

Fix: keep scaleX. Set scaleY so the height is about 8–12 px (`10/40`) on the wizard, pumpkins, and stones.

**Medium — A3 mushroom and root placement is still not the seeded layout.** Mushrooms are still a count of 6 in the scatter list (`src/scenes/GraveyardWorld.ts:211`), not 1–2 beside about half the trees. Roots use `Math.random()` for scale and flip (`:420` and `:424`) instead of `mulberry32(1031)`. Depth `y - 3` and the other decals' seeded scale, alpha, flip, and tint are fine.

Fix: drop mushrooms from that loop and place 1–2 per tree for about half the trees from the same RNG. Drive root scale (0.9–1.2) and flipX from that RNG too.
