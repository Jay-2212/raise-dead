# Raise Dead: Visual Style Guide

**One-line pitch:** a cosy-spooky graveyard under a full moon, drawn in hi-bit pixel art. Picture the *Plants vs Zombies* night lawn as a top-down RPG. It should read clearly and feel charming, never gory.

Reference image: `backgrounds/title_keyart.png`. It sets the look, and every other asset is matched to it.

## Rendering rules (for the Phaser setup)
- Art is authored in **art pixels**. Run Phaser with `pixelArt: true` (or `roundPixels: true` plus NEAREST filtering) and set the **world camera zoom to 2**.
- **Tile = 32 art px, which is 64 screen px.** The ground textures are 256×256 art px, so one texture covers an 8×8 block of tiles. Draw them with `TileSprite`.
- Logical world view: 640×360 art px, filling a 1280×720 canvas (or 1920×1080 at zoom 3).
- The UI layer (`ui/`, `portraits/`, `backgrounds/`) is authored at screen resolution. Put it on a separate camera at zoom 1, or set scrollFactor 0 with no zoom.
- Depth: y-sort world sprites, with origin (0.5, 1) at the feet or base. Every world sprite is trimmed, so its bottom edge is the ground contact line.

## Perspective
Top-down 3/4 view. You see the front face of objects plus a sliver of their tops. Light comes from the **upper-left**, as cool moonlight. There are no baked cast shadows on the ground. In-engine, add a soft dark ellipse under each sprite (alpha 0.35, colour #0b1020).

## Line and shading
- Crisp 1-art-px dark outline in **night ink #0b1020** or deep navy. Outlines are never pure black.
- Flat shading with 2 or 3 tone steps. Edges facing the moon get a cool rim-light in teal/cyan. No gradients on sprites; only FX textures use soft gradients.
- Warm light comes **only** from jack-o'-lanterns (orange) and holy light (white-gold). Everything else stays cool, which keeps both kinds of glow readable.

## Palette (hex)
| Role | Hex |
|---|---|
| Night ink (outline / darkest) | #0b1020 |
| Deep navy (sky top, UI panel) | #121a33 / #0e1526 |
| Midnight blue | #1c2a4a |
| Moon-teal shadow | #1f4a5a |
| Teal (rim light, glows) | #2f7d86 |
| Moon cyan (runes, highlights) | #7fd1d8 |
| Moonlight pale | #d9f2ee |
| Moon cream | #f3ecc8 |
| Grass dark / mid / light | #1d3a34 / #2c5446 / #4a7a5f |
| Soil / soil light | #2a2230 / #43384a |
| Stone dark / mid / light | #3a4458 / #5d6b80 / #9aa8b8 |
| Bark dark / mid / light | #1a1a2a / #2e2a3e / #4a4660 |
| Pumpkin shadow / skin / inner glow | #a8461a / #f08a24 / #ffd25e |
| Leaf brown / rust / orange / yellow | #8a4b23 / #c0622b / #f08a24 / #d9a441 |
| Wisp mint | #9effc8 |
| Holy white / holy gold | #fffbe8 / #ffe9a8 |
| UI bone trim | #c9b98a |

Fonts are not part of this kit. Suggestion: a pixel serif for tombstone names, such as "Pixelify Sans" or "Jacquard 12" (both on Google Fonts, OFL). Use bone #c9b98a or moonlight #d9f2ee on navy.

## Sprite sizes (art px; double them for screen px)
| Asset | Size |
|---|---|
| Wizard (vendor, Movicx) | 64×64 frames (figure ≈ 50 px tall) |
| Launch tombstone (3 states, shared canvas) | 73×55 canvas, stone ≈ 56 px wide |
| Decorative grave markers | 44 px tall |
| Trees | 128 to 176 px tall |
| Jack-o'-lantern | 28×25 |
| Crow | 24×18 perched, 32×32 flying |
| Leaf particles | ≤10 px, in a 12×12 strip |
| Wisp | 32×32 glow (scale 0.3 to 1) |

UI and screen-res assets: medallions 256×256, panel frame 720×385, backgrounds and vignette 1920×1080, holy burst 1024×1024, rune circle 512×512.

## Tombstone text
At 56 art px wide, the face is too small for readable text. Show the name, years and epitaph on a **UI plaque**: `ui/frame_panel.png` at small size, plus the grave's medallion, popping up above the stone when the player is in range. If you want, add a 1 to 2 word name on the sprite in a 5 px pixel font.

## Asset list (filenames under assets/images/)
**Character (vendor)**
- `vendor/movicx-wizard/walk_down.png` (4 frames), `walk_up.png` (4), `walk_left.png` (5), `walk_right.png` (5). All are 64×64 frames.
- `vendor/movicx-wizard/attack_front.png` / `attack_left.png` / `attack_right.png` (7 frames each) and `attack_behind.png` (6). Use these as the **exorcism casting** animation.
- `vendor/movicx-wizard/mage_idle.png` (7 frames, front) and `mage_idle1.png` (2 frames).
- Alternative, CC0: `vendor/sollision-mage/player_mage_32x64_grid.png`. A hooded mage with glowing eyes, 32×64 frames. Rows 0 to 3 are idle (back, front, side, side) at 5 frames each. Rows 4 to 7 are walk in the same order at 10 frames each. Check which side row faces left and use flipX if needed.

**World**
- `world/ground_grass.png`: tileable grass.
- `world/ground_path.png`: tileable gravel path.
- `world/tomb_plain.png`, `world/tomb_cracked.png`, `world/tomb_rubble.png`: the three states of a launch grave.
- `world/tomb_deco_cross.png`, `world/tomb_deco_square.png`, `world/tomb_deco_obelisk.png`: decorative graves.
- `world/tree_1.png` to `world/tree_4.png`.
- `world/jackolantern_lit.png`.
- `world/crow_perched.png`, `world/crow_flying.png`.

**FX and particles**
- `fx/fog_tile.png`: tileable. Scroll 2 or 3 layers at different speeds, alpha 0.25 to 0.5.
- `fx/fog_puff.png`.
- `fx/holy_light_burst.png`: ADD blend, scaled up from the grave.
- `fx/rune_circle.png` (transparent) and `fx/rune_circle_add.png` (on black, for ADD blend).
- `fx/glow_warm.png`: pumpkin light pool.
- `fx/glow_moon.png`: cool light pool.
- `particles/leaf_1.png` to `leaf_8.png` and `particles/leaves_strip.png` (12×12 frames, 8 frames).
- `particles/wisp.png` and `particles/firefly_dot.png`.
- Extra CC0 textures from Kenney in `vendor/kenney-particle-pack/` (magic_*, spark_*, star_*, twirl_*, light_*, smoke_*), `vendor/kenney-smoke-particles/` and `vendor/kenney-light-masks/`. They are white or greyscale, so tint them with the palette above.

**Backgrounds and UI**
- `backgrounds/title_keyart.png`: 1920×1080 with empty sky at top-centre for the logo.
- `backgrounds/sky_moon.png`: 1920×1080 sky and moon layer.
- `ui/frame_panel.png`: app-overlay / plaque frame. Use it as a **NineSlice** with left 64, right 64, top 60, bottom 60. The top-centre moon emblem stretches with the top edge. For very wide panels, hide it under a separate moon sprite or accept the stretch.
- `ui/vignette_moonlit.png`: fullscreen navy vignette.
- `portraits/medal_roadrash.png`, `medal_reader.png`, `medal_clippy.png`, `medal_winamp.png`, `medal_unmarked.png`: 256×256 stone medallions, one per launch grave. For "Unmarked Grave" apps generated at runtime, reuse `medal_unmarked.png` or composite the Muse image into the empty centre.

**Sources**: `src/rd_*.png` holds the hi-res generated originals (1024 to 1408 px). They are for marketing, the Devpost page and future edits. **Do not load them at runtime.**

## Motion and FX notes
- Leaves: drift down and to the right, rotating, with a lifespan of 6 to 10 s, 6 to 12 on screen at once. Use the orange and rust frames more often than the others.
- Wisps: ADD blend, a slow sine wander, alpha pulsing between 0.4 and 1, tinted #9effc8.
- Pumpkins: animate the alpha and scale of `glow_warm` with noise, between 0.85 and 1.0.
- Ritual sequence:
  1. The rune circle scales from 0 to 1 under the player and rotates at 10°/s.
  2. Camera shake.
  3. Swap the tombstone to `tomb_cracked`.
  4. `holy_light_burst` scales from 0.2 to 4 over 1.2 s.
  5. Fade to a full white flash, then fade into the app overlay inside `frame_panel`.
  6. On exit, reverse the sequence and leave `tomb_plain` (or `tomb_rubble` if you want a "visited" state).
