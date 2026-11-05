# Polish Pass — Design

## Audio: `src/audio/Mixer.ts`
- Installed once in `BootScene.create()`. Two GainNodes (music, fx) feed Phaser's master mute node.
  `game.sound.add` is wrapped so each new sound's output is re-routed: keys `title_waltz`,
  `moonlit_lullaby`, `chant_drone_loop` → music bus; everything else → effects bus.
- Gain = level² (audio taper) under master 0.85, so 70 % ≈ -8 dB. Levels in `rd_vol_music` / `rd_vol_fx`.
- Missing cache keys play a 1-sample silent buffer instead of throwing (lets audio load late).
- `unlockAudio()` resumes the context inside the entry gesture; fire-and-forget.

## Title: one press
- `TitleScene.enter()` is idempotent; bound to scene `pointerdown` (ignores the Credits button),
  `keydown-ENTER`, `keydown-SPACE`. It unlocks audio, fades the waltz, waits for world assets if needed,
  then fades to `GraveyardWorld`. The waltz tween is killed before the sound is destroyed (a tween writing
  `volume` to a destroyed sound throws and stalls the loop — found in headless testing).

## Volume UI: `src/ui/VolumeControl.ts`
- Drawn speaker icon (no emoji: it rendered as tofu), panel 204×44 slides left from the icon.
  Hover opens; leaving icon+panel closes after 450 ms; desktop click mutes. Touch: first tap opens,
  tap on icon while open mutes, tap elsewhere closes. 5 % steps.

## Map: `src/ui/mapPainter.ts` + `src/ui/WorldMap.ts`
- Static ground painted once into a 2× CanvasTexture (LINEAR): grass pattern + tonal patches, gravel
  path network (edge, fill, crown on main roads, speckle), plaza ring, old stones, three-lobe tree crowns,
  landmarks read from the live world (lit pumpkins as warm glows, crypt, well), Moon Hill clearing,
  moonlight wash, vignette, rounded clip.
- Dynamic layer (every 50 ms): camera view rectangle, tombstone markers (teal raised / bone + amber pulse
  waiting), focus ring on nearest-or-hovered grave, found secrets, heading arrow for the wizard.
- Frame: bone border, corner studs, N tab, caption strip naming the focused grave (short names).
  Click a grave marker on the minimap → fast travel; elsewhere → full map.
- Full map uses the same painter; north-arc labels above, south-arc below, alternating two tiers with
  leader lines; every grave label is a fast-travel hit zone.

## Map from the real world art (K12)
- Problem: the painted map still read as grey roads on flat teal. Players expect a minimap of *this*
  graveyard with its grass visible.
- `scripts/bake-world-map.mjs` renders the live world at half scale (1200×900) in headless Chromium,
  with HUD, fog, particles, wizard, crow/witch, eggs and the raisable tombstones hidden, in three passes
  (all / grass only / everything but grass). `scripts/compose-world-map.py` softens the repeating grass
  tile into a meadow, drops a soft shadow from trees, stones, paths and pumpkins onto it and lifts
  contrast. pngquant → `public/assets/images/map/world_map.png` (~230 KB), loaded on the first screen
  as `map_world`.
- `paintMapGround` draws it when present (halving downscale steps, light moonlit wash, tonal patches,
  slight dark vignette; the minimap gets a small contrast lift). The canvas is 1× for the baked art: a
  2× canvas is minified with nearest filtering (pixelArt) and speckles the grass. The hand-painted map
  stays as the fallback, and the minimap repaints itself once if `map_world` arrives late.
- Readability over busier art: grave/region/secret/"you" labels sit on dark rounded plates with a thin
  bone/teal/amber border; leader lines get a night underline; tombstone markers get a night outline;
  the viewport box gets a dark outer stroke; hidden-secret "?" marks sit on dark discs.
- Unchanged: teal raised / pulsing bone waiting markers, heading arrow, viewport box, N tab, caption,
  leader-line labels, minimap click-to-walk and full-map click-to-fast-travel.

## Performance
- `queueWorldAssets` = title + first graveyard screen. `queueDeferredAssets` (ritual, voices, egg/horde
  sfx) is started by `GraveyardWorld.create()` after the world is on screen.
- `scripts/compress-assets.sh` documents the one-off re-encode/compression (already applied).
- `public/_headers`: hashed JS immutable 1 y; audio/images/voice 7 d + SWR; fonts 30 d; DOOM WAD 30 d
  immutable; vendor/lib 30 d.

## Small fixes
- `GraveOverlay`: for full-bleed games (DOOM) Esc never exits from the parent page; it refocuses the
  game iframe and pulses the ✕ (DOOM's own Esc menu stays consistent).
- Space Cadet renderer retries a plain WebGL context before falling back; fallback text is friendlier.
