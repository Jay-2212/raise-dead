# Phase 1 build brief (for Kiro)

Goal today: a runnable **Vite + TypeScript (strict) + Phaser 3.90.0 (pinned exactly)** game. Read first: PLAN.md, .kiro/steering/*.md, .kiro/specs/graveyard-world/*, .kiro/specs/resurrection-ritual/*, assets/images/STYLE.md, research/public-assets.txt (every runtime asset already copied into `public/`, with pixel sizes). Do NOT load anything from `assets/` at runtime — only from `public/` (served at `/`). Never reference `assets/images/src`.

Where the brief and the older spec text disagree (e.g. tile JSON tilemap, file names like `incantation.mp3`, `tomb-seal.mp3`, stone-crack spritesheet, rune font), **this brief wins**: use the real files listed in research/public-assets.txt.

## Stack / config
- `phaser@3.90.0` exact, `phaser3-rex-plugins@1.80.20` exact, `vite ^6.3.1`, `typescript ~5.7`. Scripts: dev, build (`tsc --noEmit && vite build`), preview, typecheck.
- Canvas 1280×720, `Phaser.Scale.FIT` + `CENTER_BOTH`, `pixelArt: true`, `roundPixels: true`, WebGL (AUTO), Arcade physics, parent `#game-container`, `dom.createContainer` not required (use plain DOM overlay for the app panel).
- World camera zoom **2**. HUD/UI elements use `setScrollFactor(0)` and are sized for the zoomed camera — or, cleaner, run HUD in a separate `UIScene` on top at zoom 1. Pick one and be consistent.
- Fonts: Google Fonts link in index.html: "Pixelify Sans" (plaques/UI) and "Cinzel" (titles/subtitles). Wait for `document.fonts.ready` before creating text.

## Scenes
`BootScene → PreloadScene (progress bar) → TitleScene → GraveyardWorld (+ UIScene) ⇄ ResurrectionRitual`, plus `CreditsScene`.

### TitleScene
- Full-screen `images/backgrounds/title_keyart.jpg` (1920×1080, scale to cover 1280×720), title "RAISE DEAD" + subtitle "Graveyard of Lost Apps" in Cinzel, pale moonlight #d9f2ee with soft glow, in the empty sky top-centre.
- Pulsing "Click to enter the graveyard" + small "Credits" button.
- Music: `audio/music/title_musicbox_spooky_waltz` (loop). Browsers need a gesture: show the click prompt; first click unlocks audio. If audio is locked, start the waltz on first pointerdown, then a second click (or the same click after a short fade) enters. Simplest acceptable: click → waltz fades out 0.8s → camera fade → GraveyardWorld. Play the waltz from the moment the sound manager is unlocked.

### GraveyardWorld (world ~ 2400×1800 art px)
- Ground: `TileSprite` of `world/ground_grass.png` covering the world; gravel paths using `world/ground_path.png` TileSprites (a cross / ring path layout through the centre and between grave rows). Keep a list of path rectangles for footstep surface detection.
- Wizard (Movicx, 64×64 frames): spritesheets `wizard/walk_down.png` (4f), `walk_up.png` (4f), `walk_left.png` (5f), `walk_right.png` (5f), `mage_idle.png` (7f, front idle), `attack_front/left/right.png` (7f), `attack_behind.png` (6f). Origin (0.5,1), small physics body at the feet, speed ~90 art px/s, diagonal normalised, WASD + arrows. Idle anim when not moving (use mage_idle for down-facing, first frame of the walk sheet for other facings). Soft dark shadow ellipse (#0b1020, alpha 0.35) under him and under trees/graves/pumpkins.
- Y-sort depth for world sprites (depth = y).
- Graves: all 40 from `/data/graves.json` (load with `this.load.json`). The 5 `resurrectable:true` graves (sort_priority 1–5) are placed prominently in an arc/semicircle around the central plaza (near the spawn point), each using `world/tomb_plain.png` (73×55; states `tomb_cracked`, `tomb_rubble`), with a faint pulsing teal/mint glow (`fx/glow_moon.png` ADD, tint #7fd1d8, alpha 0.25–0.5) and a small medallion `portraits/medal_*.png` (scaled to ~20 art px) floating/pinned above the stone. Medallion mapping: road-rash→medal_roadrash, google-reader→medal_reader, clippy→medal_clippy, winamp→medal_winamp, unmarked-grave→medal_unmarked. The other 35 use `tomb_deco_cross/square/obelisk.png` in tidy rows (with some jitter) in outer areas. Static physics bodies so the wizard can't walk through stones/trees (small base bodies only).
- Plaque popup: when the wizard is within ~40 art px of any grave OR the pointer hovers it, show a plaque above it: NineSlice of `ui/frame_panel.png` (720×385, slices L64 R64 T60 B60) rendered small (HUD space ~ 360–420 px wide), containing the medallion (resurrectable only), name, years (born–died; years may be numbers or ISO date strings — show the year part), epitaph in italics, and "Cause of death: …" in smaller text. Text colours bone #c9b98a / moonlight #d9f2ee on navy. Only one plaque at a time (closest grave). Must stay fully on screen.
- Prompt: near a resurrectable grave, show "Press F to raise the dead" (pulsing, HUD bottom-centre) and play `audio/ui/prompt_press_f` once per approach. F (or the mobile F button) launches the ritual.
- Trees: 4 variants `world/tree_1..4.png` (~25–35 instances) scattered around the edges and between rows, never on paths or graves.
- Jack-o'-lanterns: `world/jackolantern_lit.png` × 8–10 along paths/plaza; warm light: Phaser Light2D point lights (orange #f08a24, radius ~90 art px) with noise flicker on intensity, plus an ADD `fx/glow_warm.png` sprite flickering alpha/scale 0.85–1.0. Light2D: enable `this.lights.enable().setAmbientColor(0x5a6a96)` — keep the scene readable (moonlit blue, not pitch black); apply `setPipeline('Light2D')` to ground, graves, trees, pumpkins, wizard. Add a soft cool light following the wizard (#9fc8ff, radius ~120, intensity ~0.6). Glow sprites/particles/fog/UI do NOT use Light2D.
- Fog: 2–3 `TileSprite`s of `fx/fog_tile.png` (ADD or NORMAL, alpha 0.18–0.35, different scroll speeds, depth above ground, below UI). Optionally a few drifting `fx/fog_puff.png`.
- Leaves: particle emitter with the `particles/leaves_strip.png` spritesheet (12×12, 8 frames) — drift down-right, rotate, lifespan 6–10 s, 6–12 on screen, follows camera view.
- Wisps/fireflies: ~12 `particles/wisp.png` ADD sprites tinted #9effc8, slow sine wander, alpha pulse 0.4–1, plus `particles/firefly_dot.png` cores.
- Crow fly-by every 20–45 s: `world/crow_flying.png` (32×32 single frame — fake flapping with a scaleY tween) crossing the screen, with `audio/ambient/crow_caw_02`.
- Vignette: `ui/vignette_moonlit.png` fullscreen in HUD at alpha ~0.7.
- Camera: follow wizard (lerp 0.1), bounds = world, zoom 2.
- Audio (via a small `AudioManager` helper; respects mute M key, persisted in localStorage):
  - music loop `audio/music/moonlit_lullaby_loop` vol 0.35
  - loops: `ambient/wind_howl_loop` 0.3, `ambient/night_crickets_loop` 0.25, `ambient/ghost_whispers_loop` 0.12
  - random one-shots every 12–35 s: `owl_hoot_01/02`, `crows_distant_01`, `tree_creak_01`, `gate_creak_01` (vol 0.3–0.5, slight random detune)
  - footsteps: every ~0.33 s while moving: random `footsteps/dirt_0N` (N=1..8) on grass, random `footsteps/gravel_0N` on gravel paths, vol ~0.35.
  - Load audio as `[ogg, mp3]` pairs.
- Mobile: rex VirtualJoystick (`phaser3-rex-plugins/plugins/virtualjoystick-plugin.js`) + an on-screen "F" button, shown only when `navigator.maxTouchPoints > 0` or `?touch=1` query param.
- HUD corner: small "Credits" and mute buttons.

### ResurrectionRitual (launched on top, GraveyardWorld input paused)
Timeline (~8–10 s total, tuned to voice length; skip-safe):
1. t=0: wizard plays cast animation (attack_* matching facing direction toward the grave), `audio/ui/ritual_confirm`, `audio/exorcism/rune_sparkles`; `fx/rune_circle_add.png` (ADD, tint #7fd1d8) scales 0→~0.35 under the wizard/grave and rotates 10°/s; chant `exorcism/chant_drone_loop` fades in; ambient music ducks to ~0.1.
2. t≈0.4: incantation voice for that grave: `voice/incant_<key>` where key = roadrash | googlereader | clippy | winamp | unmarked (map from grave id), with subtitles from `/data/voice_lines.json` (`subtitle` field, Cinzel, bottom of HUD, letterbox-style dark band). Subtitles revealed progressively over the clip duration.
3. ~2 s before voice ends: `exorcism/wind_swell` + `exorcism/ground_rumble`; camera shake building (0.004→0.012); Kenney sparks (`kenney/spark_01.png`, `magic_01.png`) swirl up from the grave.
4. Voice end: stone swaps tomb_plain → tomb_cracked (+ `exorcism/stone_crack_crumble`), 0.6 s later → tomb_rubble with dust (`kenney/smoke_04.png`).
5. Then `fx/holy_light_burst.png` (ADD) scales 0.2→4 over 1.2 s from the grave, with `exorcism/holy_light_burst` + `exorcism/choir_aah`; the screen floods white (full-screen white rect alpha → 1).
6. White hold 0.3 s → app overlay (DOM) fades in while white fades out; `exorcism/app_open_shimmer`.
- Esc during steps 1–5 cancels: stop sounds/tweens, restore stone to plain, back to graveyard.

### App overlay (DOM, `src/ui/GraveOverlay.ts`)
- Absolutely positioned over `#game-container`, styled as the UI frame: use `ui/frame_panel.png` as a CSS `border-image` (slice 60 64 60 64 fill) on a ~min(92vw, 1000px) × min(86vh, 620px) panel, navy interior.
- Phase 1 content: medallion image, "<Grave name> has risen", epitaph, a line "The full tribute app arrives in Phase 2." and a button **"Requiescat in pace"** (Cinzel, bone trim). `mount(graveId)` / `unmount()` API so Phase 2 can plug in `src/graves/<id>/index.ts` apps (dynamic import with placeholder fallback).
- Exit (button or Esc): `exorcism/app_sink` + `exorcism/rip_bell_toll` (+ optional `voice/farewell_requiescat`), overlay sinks/fades, white flash fades back out (reverse light), stone returns to `tomb_plain` (with a brief reverse dust puff), ambient/music restore, GraveyardWorld resumes.

### CreditsScene
- Renders the content of `/CREDITS.md` (fetch it, light markdown → text: headings, bullet/table rows as readable lines; strip markdown link syntax but keep URLs) in a scrollable panel (mouse wheel/drag/arrow keys), Esc/Back returns to where you came from (title or graveyard).
- Must prominently include (pin these at the top as "Required attributions"):
  - "Wizard sprite by Movicx (opengameart.org/users/movicx), CC-BY 3.0 — https://opengameart.org/content/wizard-sprite-sheet"
  - "Footstep sounds (dirt) by congusbongus, from 'footstep-grass.wav' by swuing (freesound.org), CC-BY 3.0 — https://opengameart.org/content/footsteps-on-different-surfaces"

## Code layout
Follow .kiro/steering/structure.md: `src/main.ts`, `src/config.ts`, `src/scenes/*`, `src/ui/*` (GraveOverlay, Tombstone, ProximityHint/Plaque, Joystick), `src/audio/AudioManager.ts`, `src/types/graves.ts`, `src/types/ritual.ts`, `src/scenes/mapLayout.ts`. Small, readable modules. No secrets anywhere.

## Done when
- `npm run build` passes with zero TS errors.
- Expose `window.__RD` debug hooks for automated screenshots (only harmless helpers): `window.__RD.game` (the Phaser.Game) and `window.__RD.goto(scene)`, `window.__RD.teleportToGrave(id)`, `window.__RD.raise(id)` (starts ritual for that grave).
- Tick the corresponding checkboxes in `.kiro/specs/graveyard-world/tasks.md` and `.kiro/specs/resurrection-ritual/tasks.md` (mark `[x]`; if a task was superseded by this brief, mark `[x]` and append "(Phase 1: <what was done instead>)").
