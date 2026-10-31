# Phase 1.5 polish brief (for Kiro)

> **Jay (the project owner) played the build and is thrilled: the sounds are perfect, the theming is beautiful, it blew his expectations away. He's proud of every agent's work on this.**

Keep everything he loves exactly as it is (sounds, pumpkins, leaves, fireflies, crows, the plaque popup, the ritual). This phase fixes what he hit while playing and adds a little delight. Phaser 3.90 + TypeScript + Vite. `npm run build` must pass at the end of every session. Do not touch `research/` or `assets/` (masters). All new art/audio is already in `public/` (listed below); do not invent other asset paths.

Note: Light2D is effectively OFF in this project (`applyLightPipeline` is never called), so `this.lights.*` calls have no visible effect. Do lighting effects with ADD-blend images, tints and screen overlays, not Light2D.

## New assets already in public/ (load them in `src/scenes/worldAssets.ts` `queueWorldAssets`)

Images (art px, pixel-art, keep `pixelArt` crispness):
| key | path | size | notes |
|---|---|---|---|
| shadow_contact | assets/images/fx/shadow_contact.png | 64×24 | soft dark ellipse, alpha baked in; scale to footprint |
| shadow_cast | assets/images/fx/shadow_cast.png | 96×40 | softer, larger: moon-cast shadow |
| decal_grave_mound | assets/images/decals/decal_grave_mound.png | 36×44 | vertical oval dirt plot (goes in FRONT/south of a headstone) |
| decal_dirt_patch | assets/images/decals/decal_dirt_patch.png | 48×45 | |
| decal_sunken_soil | assets/images/decals/decal_sunken_soil.png | 40×36 | |
| decal_grass_tuft | assets/images/decals/decal_grass_tuft.png | 16×17 | |
| decal_grass_tuft_flowers | assets/images/decals/decal_grass_tuft_flowers.png | 22×22 | |
| decal_roots | assets/images/decals/decal_roots.png | 46×44 | tree-base roots |
| decal_pebbles | assets/images/decals/decal_pebbles.png | 30×27 | |
| decal_leaf_litter | assets/images/decals/decal_leaf_litter.png | 32×28 | |
| decal_mushrooms | assets/images/decals/decal_mushrooms.png | 14×14 | |
| witch_broom | assets/images/eggs/witch_broom.png | 72×64 | faces RIGHT (flip X for leftward flight) |
| black_cat_walk | assets/images/eggs/black_cat_walk.png | spritesheet 4 frames of 22×20 | faces RIGHT |
| pumpkin_plain | assets/images/eggs/pumpkin_plain.png | 28×28 | uncarved pumpkin |
| crypt / crypt_open | assets/images/eggs/crypt.png, crypt_open.png | 52×59 each | closed door / open door with candle glow + candy |
| well | assets/images/eggs/well.png | 40×55 | old stone well |
| ghost_lady | assets/images/eggs/ghost_lady.png | 30×37 | friendly translucent ghost |
| wolf_spirit | assets/images/eggs/wolf_spirit.png | 40×46 | moonlight wolf howling, faces LEFT |
| candy / candy_bag / turnip_lantern | assets/images/eggs/*.png | 16×16 / 18×19 / 22×25 | |

Audio (each `.ogg` + `.mp3` in `assets/audio/sfx/`, load as `[ogg, mp3]` like the others): `witch_cackle`, `witch_cackle_2`, `cat_meow`, `knock_wood`, `candy_chime`, `pumpkin_carve`, `wolf_howl`, `ghost_breath`.

---

# SESSION A: fixes, grounding, collision, witch

## A1. "Requiescat in pace" button does nothing on click (Esc works)
Root cause: `GraveOverlay.triggerExit()` dispatches a `rip-exit` window event, but `ResurrectionRitual` no longer listens for it (P1-2 switched to the `onExit` callback passed to `mount`). Fix: `triggerExit()` must call `this.onExitCallback?.()` (keep it idempotent; `startExitRitual` already guards on phase). Use `pointerup`/`click` that works on touch too (add `touch-action: manipulation` on the button). Make sure no Phaser canvas or wrapper sits above the button: the overlay must receive pointer events (`pointer-events: all` on overlay + panel + button). Verify a real mouse click AND a tap exit.

## A2. Whole graveyard explorable (all 40 graves reachable)
Root cause: the arcade physics world bounds default to the game size, not the 2400×1800 world, so `setCollideWorldBounds` traps the wizard near spawn. In `GraveyardWorld.create()` call `this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)` before spawning; keep camera bounds 0,0,WORLD_W,WORLD_H. Then audit the layout so every one of the 40 graves can be walked up to (no tree trunk, crypt or well blocks the approach; keep ≥36 art px clear walking gaps between colliders). Add a thin margin (16 px) so the wizard cannot walk off the visible edge. Extend the path network a little so the outer rows feel connected: add path strips along each grave row (32 px tall, at y≈440, 740 and 1135, for x 340–1120 and 1380–2140; keep them clear of the grave mounds) and a lower path from the plaza's south path toward the moonlit clearing (x 1000→1176 at y≈1680, plus x≈1176 y 1600→1700). Update `PATH_RECTS` (footstep surface uses it).

## A3. Grounding: nothing should look like it floats
- Remove the flat `add.ellipse` shadows (trees, tombstones, wizard).
- Each object gets TWO layers: a **contact shadow** (`shadow_contact`, scaled so its width ≈ 1.1× the sprite's base footprint and height ≈ 8–10 art px, alpha ≈ 0.6, centred 1 px above the sprite's bottom) and a **cast shadow** (`shadow_cast`, offset toward the lower-right because moonlight comes from the upper-left: +0.25×width in x, +3 px in y, scaleX ≈ 1.3× footprint, alpha ≈ 0.3). Depth: just below the object (`y - 1` / `y - 2`), above ground decals.
  - Tombstones: footprint = stone sprite width (73 for resurrectable, ~30–43 for deco). Put this in `Tombstone.ts` instead of `shadowEllipse`.
  - Trees: contact shadow ≈ 44×10 at trunk base; cast shadow ≈ 130×36 offset (+30, +6), alpha 0.25 (canopy shadow).
  - Pumpkins, crypt, well, cat: contact shadow at footprint.
- **Grave plots:** a `decal_grave_mound` directly in front (south) of every resurrectable grave and ~70% of decorative graves (seeded choice), centre at (x, y + 16), scale 0.75–0.9, alpha 0.9, small random flipX. Depth on the ground decal layer (-8).
- **Ground variation** with a seeded RNG (e.g. mulberry32(1031)) so it is identical every load, on the decal layer (depth -8, above grass -10 / paths -9), never on a path rect except pebbles and leaf litter: ~150 `decal_grass_tuft`, ~30 `decal_grass_tuft_flowers`, ~28 `decal_dirt_patch`, ~14 `decal_sunken_soil`, ~24 `decal_pebbles`, ~30 `decal_leaf_litter`, `decal_mushrooms` 1–2 near ~half the trees, and `decal_roots` under every tree trunk (scale 0.9–1.2, depth tree.y - 3). Random flipX, scale 0.8–1.15, alpha 0.85–1, small tint jitter toward navy (e.g. `setTint(0xc8d4e8)`) so the decals match the moonlit palette. Skip decals within 24 px of a grave base or the plaza centre. Grass tufts may sit just in front of graves/trees to tuck the base in.
- Keep it cheap: plain Images (or a single RenderTexture baked once at create if > 300 objects). Must keep 60 fps.

## A4. Wizard looks like he floats / no visible feet
Keep the Movicx wizard (the sprite does have boots; the bottom 3 rows of each 64×64 frame are transparent, so origin (0.5,1) leaves a gap). Fix:
- Set origin so the boots touch the ground: `setOrigin(0.5, 61/64)` (verify against frames; `body.setOffset` must be adjusted so the physics feet stay at the boots).
- Contact shadow under the boots (`shadow_contact`, ~28×8, alpha 0.65) + small cast shadow offset lower-right (alpha 0.25).
- Walk bob: while moving, add a subtle 1 art px vertical bob synced to the walk cycle (sprite only, not the body or shadow), and the contact shadow scales 0.92↔1.0 in sync. Idle: no bob (or a 0.5 px slow breathe). Keep the walk animation frame rates.

## A5. Trees: trunk collision with depth sorting
Add a static physics body per tree at the trunk footprint only (≈ 18×10 art px centred at the tree's base x, base y - 5; adjust per texture if the trunk isn't centred: tree_3 and tree_4 are wide; find the trunk by checking the bottom rows of the PNG's alpha). Collide wizard with them. Canopies stay non-colliding; depth stays y-sorted (`setDepth(y)`), so the wizard walks behind canopies when north of the trunk and in front when south. Make sure no tree blocks access to a grave or egg; move any tree that does.

## A6. Tone down grave shimmer ~35%
`Tombstone.ts` glow: alpha tween 0.25→0.5 becomes 0.16→0.32, base alpha 0.2, scale tween 0.33→0.38 becomes 0.31→0.335. Leave medallion float as is.

## A7. Witch fly-by
- Random interval 35–75 s (first one 12–20 s after entering the graveyard), never during ritual/overlay/credits, never at the same time as a crow.
- Flies across the top band of the CURRENT camera view (y = worldView.top + 30…90), from off-screen left to off-screen right or reverse (flipX when flying left), duration 5–6.5 s, with a gentle sine wave in y (amplitude 8 px, 2 cycles) and a slight tilt (angle ±4°). Depth 60 (above trees, below fog/HUD). Optional: a faint trailing sparkle/leaf particle behind the broom.
- Sound: `witch_cackle` or `witch_cackle_2` (random), volume 0.35, played when she enters the view; pan it left/right with her position if easy (Phaser `pan`).
- Debug hook: `window.__RD.spawnWitch()`.

## A8. Debug hooks for verification (DEV or ?debug=1 only, like the existing ones)
`__RD.teleport(x, y)` (wizard to world point, camera centres), `__RD.spawnWitch()`, `__RD.world()` returns the GraveyardWorld scene.

---

# SESSION B: Halloween Easter eggs (cozy-spooky, teach the lore)

Jay is from India and doesn't know Halloween traditions, so each egg shows a short lore card when found. Six eggs. Persist found IDs in `localStorage` key `rd_eggs_found` (JSON array). HUD shows `Secrets 2/6` (Pixelify Sans 14 px, `#c9b98a`, top-right under the mute button; plain text, no emoji) once at least one is found; when a new one is found, the counter pulses and a soft `candy_chime` plays.

### Architecture
- `src/easter/eggDefinitions.ts` (data: id, position, radius, trigger, title, text, sprite keys) and `src/easter/EasterEggManager.ts` (created by GraveyardWorld; `update(dt, wizard)`, `tryInteract(): boolean`, `foundCount`, events).
- **F / mobile action priority:** if a resurrectable grave is active → ritual (unchanged). Else `eggManager.tryInteract()`. Both keyboard `keydown-F` and the joystick F button go through one `GraveyardWorld.interact()` method.
- **Guards:** nothing triggers while `ritualActive`, while ResurrectionRitual/CreditsScene is active, or while the overlay is open.
- **Hint:** near an F-egg the existing ProximityHint shows the egg's verb ("Press F to carve" / "Tap F to carve" on touch). Grave hint wins if both.
- **Lore card:** reuse the plaque look (same frame, fonts) with title + body text and an optional small icon (e.g. turnip_lantern for Jack). Auto-hides after 9 s or when the wizard walks > 90 px away; can be re-read for static eggs by pressing F again. Do NOT block movement.
- Each egg gets the A3 contact shadow.

### The six eggs (positions are art px; nudge if something overlaps after Session A, but keep each ≥ 120 px from the five resurrectable graves)
1. **black_cat** — area trigger: wizard enters a 40 px radius around (420, 900) (left end of the main path). The cat (`black_cat_walk`, 4-frame walk at 10 fps) runs across the wizard's path, from 60 px left of him to 60 px right (or reverse), 1.4 s, `cat_meow` vol 0.5, then sits briefly and fades. One-time.
   - Title: **"A black cat crossed your path!"**
   - Text: "In old European folklore, black cats were said to be witches' companions, or even witches in disguise, so one crossing your path meant bad luck. Not everywhere agrees: in Scotland and Japan a black cat is a sign of good fortune. On Halloween they're simply the season's mascot."
2. **jack_pumpkin** — `pumpkin_plain` at (680, 1180). F within 34 px: pumpkin shakes ±2 px for 0.4 s with `pumpkin_carve`, then becomes `jackolantern_lit` with the warm glow + flicker used by the other pumpkins. Stays lit (also on reload if found).
   - Title: **"The legend of Stingy Jack"**
   - Text: "Irish folklore tells of Stingy Jack, a trickster who fooled the Devil twice. When he died, neither Heaven nor Hell would take him, so he wanders the night with a coal glowing inside a carved turnip. People carved scary faces into turnips to keep him away. Irish immigrants in America found pumpkins bigger and easier to carve: the jack-o'-lantern." (icon: turnip_lantern)
3. **grave_13** — an extra decorative stone (`tomb_deco_cross`) at (2080, 1520), with grave mound, a faint green glow (alpha 0.15) and "XIII" drawn on it in a tiny pixel font is optional. F within 36 px: camera shake (0.003, 300 ms), `gate_creak_01` with detune -300, glow brightens then settles at 0.25.
   - Title: **"The 13th grave"**
   - Text: "Many people in the West consider 13 unlucky, a fear called triskaidekaphobia. One story points to the Last Supper, where Judas was the 13th guest; a popular retelling of a Norse myth has the trickster Loki crash a feast of 12 gods. Some buildings still skip the 13th floor, and Friday the 13th is the unluckiest day of all."
4. **crypt_knock** — `crypt` at (200, 640) facing south. F within 40 px of its door (door at its bottom centre): play `knock_wood` (it's three raps), short pause, door swaps to `crypt_open`, warm glow pulses at the doorway, 5–6 `candy` sprites pop out and arc onto the grass (tween, then stay as little scattered treats or fade after 6 s), `candy_chime`. Stays open on reload.
   - Title: **"Trick or treat!"**
   - Text: "Halloween grew from Samhain, a Celtic festival marking summer's end, when the boundary with the spirit world was thought to thin. In medieval Britain and Ireland the poor went 'souling' door to door, praying for the dead in return for soul cakes; in Scotland, children in costume went 'guising' and performed for treats. Today it's knock, say 'trick or treat!', and collect candy."
5. **mirror_well** — `well` at (2230, 560). F three times within 4 s while within 40 px (show "Press F (1/3)…" style hint). On the third: water shimmer (ADD glow over the well), `ghost_breath`, `ghost_lady` rises from the well (y −30 over 1.2 s, alpha 0→0.85, gentle float), waves (small x wobble), then fades after 5 s. Cozy, never scary: no jump-scare, no screen flash.
   - Title: **"Bloody Mary in the well"**
   - Text: "An old Halloween party game: at midnight, gaze into a mirror (or a still well) by candlelight and you might glimpse the face of the person you'll marry. Folklorists think it may have grown into the sleepover dare of chanting 'Bloody Mary' three times at a mirror to summon a ghost. This one only wanted to say hello."
6. **moon_howl** — a moonlit clearing at (980, 1690): draw a soft pale-blue moonlight pool on the ground (ADD `glow_moon`, tint 0xbfd8ff, alpha 0.25, scale ~1.2) so it reads as a special spot. Trigger: wizard stands still inside 30 px for 2.5 s. Then: screen brightens slightly (UIScene full-screen pale-blue rectangle, ADD, alpha 0→0.12→0 over 3 s), `wolf_spirit` fades in on a little rise 60 px to the upper-left (alpha 0→0.75, ADD or normal), `wolf_howl` vol 0.45, fades out after 4 s.
   - Title: **"Howling at the moon"**
   - Text: "European legends told of werewolves: people who turned into wolves under the full moon. The moon was blamed for odd behaviour too; 'lunatic' comes from luna, Latin for moon. Real wolves don't actually howl at the moon. They howl to call their pack, and lift their heads so the sound carries."

Debug hooks: `__RD.eggs()` returns found IDs; `__RD.resetEggs()` clears storage and reloads state; `__RD.triggerEgg(id)` runs that egg's found sequence (for screenshots).

### Session B clarifications (from review)
- Depth: ground decals/mounds/moon pool use fixed negative depths (-8); everything standing (stones, trees, wizard, eggs) uses y-sort `setDepth(y)`; their shadows use `y - 1`/`y - 2` (still far above -8).
- Lore card: add `UIScene.showLoreCard(title: string, body: string, iconKey?: string)` and `hideLoreCard()`; GraveyardWorld emits `loreCard` / `loreCardHide` events to UIScene (same pattern as `plaqueChanged`). Card uses the same NineSlice frame and fonts as the grave plaque, top-anchored at the same spot; grave plaque hides while a lore card shows. Input never blocked.
- Secrets counter: Text at (width - 12, 44), origin (1, 0), depth 100, under the mute button.
- `tryInteract()` returns true if an egg consumed the press. Each egg's found sequence is idempotent: `markFound(id)` only increments/persists once; `triggerEgg(id)` on an already-found egg replays the visual but doesn't double count.
- Restore on load: for found eggs, jack_pumpkin starts lit, crypt starts open (no candy pop), grave_13 glow at 0.25; black_cat and moon_howl don't replay automatically.
- black_cat: at trigger time, cat starts 60 px to the wizard's left at wizard.y - 6 and runs to 60 px to his right (if the wizard is moving left, reverse and flipX). Trigger only if not found.
- mirror_well: count F presses within 40 px; reset count if > 4 s since the last press or the wizard leaves 40 px. Hint text shows "Press F to peer in (1/3)" etc.
- moon_howl "still": no movement input and wizard body speed < 1 for 2.5 s continuous inside 30 px; reset the timer on any movement.
- Credits: edit `CREDITS.md` (root) as the source, then copy it to `public/CREDITS.md` so both match.

### Credits
Add to `public/CREDITS.md` and `CREDITS.md` (and README credits list if there is one) new rows:
- Images `public/assets/images/eggs/*`, `public/assets/images/decals/*`, `fx/shadow_contact.png`, `fx/shadow_cast.png`: original to this project, generated with an AI image model from our prompts (Hark image generation), downscaled/sliced by script; shadows drawn procedurally. No third-party art.
- `sfx/witch_cackle`: "Strident Laughter" by Joseph Sardin, BigSoundBank, CC0, https://bigsoundbank.com/strident-laughter-s0489.html (trimmed, echo).
- `sfx/witch_cackle_2`: "Evil Cackle Laugh 1" by Nocturnal_Vanguard (AuraVoice), CC0, https://opengameart.org/content/evil-cackle-laugh-1 (trimmed, echo).
- `sfx/cat_meow`: "Meow cat #1" by Joseph Sardin, BigSoundBank, CC0, https://bigsoundbank.com/meow-cat-1-s1889.html (trimmed).
- `sfx/knock_wood`: "Door Knock" by Joseph Sardin, BigSoundBank, CC0, https://bigsoundbank.com/door-knock-s0095.html (trimmed).
- `sfx/wolf_howl`: "Sustained Night Wolf Howl 01", SFXMint, CC0 (AI-generated by SFXMint), https://sfxmint.com/sounds/wolf-howl-01 (trimmed, echo).
- `sfx/ghost_breath`: qubodup, CC0, https://opengameart.org/content/ghost-breath (re-encoded copy of the existing ambient file).
- `sfx/candy_chime`, `sfx/pumpkin_carve`: original synthesis for Raise Dead (ffmpeg), CC0.

## Done means
- `npm run build` passes, no console errors.
- RIP button click exits; Esc still exits.
- Wizard can reach all four corners and every grave; trees block at the trunk only.
- Shadows/decals visible; nothing floats; wizard bob while walking.
- Witch flies with cackle; eggs trigger and count; reload keeps progress.
- Summarise what you changed per item at the end.
