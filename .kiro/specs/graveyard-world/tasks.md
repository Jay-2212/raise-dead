# Graveyard World — Tasks

## Setup
- [x] 1. Add `phaser@3.90.0` and `phaser3-rex-plugins@1.80.20` to `package.json` (exact versions).
- [x] 2. Create `src/types/graves.ts` — TypeScript interfaces `GraveEntry` and `GraveCategory` matching graves.json schema.
- [x] 3. Create `src/config.ts` — export `GAME_CONFIG: Phaser.Types.Core.GameConfig` with scene list, physics (Arcade), renderer (AUTO), 1280×720 base size, Light2D pipeline enabled.

## Tilemap & map
- [x] 4. Create placeholder tileset PNG (32×32 dark soil/grass tiles) in `public/assets/images/tiles/graveyard-tiles.png` and `public/assets/images/tiles/graveyard-tiles.json` (Tiled export format); update CREDITS.md. (Phase 1: Used TileSprites of ground_grass.png + ground_path.png instead, no tilemap file needed per brief)
- [x] 5. Create `mapLayout.ts` in `src/scenes/` — export array of 40 `{ id, x, y }` tombstone positions (hand-authored grid).
- [x] 6. In `GraveyardWorld.create()`, load the tilemap and create collision layer. (Phase 1: Used TileSprites + path rectangles for surface detection)

## Wizard sprite & movement
- [x] 7. Add wizard walk-cycle sprite sheet (4-direction, 4 frames each) to `public/assets/images/wizard-walk.png`; update CREDITS.md. (Phase 1: Already in public/assets/images/wizard/)
- [x] 8. Create `src/scenes/GraveyardWorld.ts` extending `Phaser.Scene` with `preload()`, `create()`, `update()` stubs.
- [x] 9. In `create()`, spawn wizard sprite with Arcade Physics at (400, 400); set `collideWorldBounds(true)`. (Phase 1: Spawned at WIZARD_SPAWN ~1200, 900)
- [x] 10. In `update()`, implement WASD movement with velocity normalisation (`walkSpeed = 150`); add walk animations per direction. (Phase 1: Implemented with walkSpeed = 90)
- [x] 11. Add tilemap collision between wizard and collision layer. (Phase 1: Added collision with tombstone static group)

## Tombstones
- [x] 12. Create `src/ui/Tombstone.ts` — `Tombstone extends Phaser.GameObjects.Container` rendering stone sprite, name text, year text.
- [x] 13. Add resurrectable glow emitter (small additive-blend green sparks) to `Tombstone` constructor when `grave.resurrectable === true`. (Phase 1: Added teal glow pulse with medallion)
- [x] 14. In `GraveyardWorld.create()`, load graves.json and spawn all 40 `Tombstone` objects at map positions.
- [x] 15. Add Static Physics body (circle r=96) to each resurrectable tombstone for proximity detection.

## Proximity & interaction
- [x] 16. Create `src/ui/ProximityHint.ts` — DOM-based or Phaser Text overlay showing "Press F to raise the dead".
- [x] 17. In `update()`, call overlap checks; show/hide `ProximityHint` based on wizard proximity to resurrectable zones.
- [x] 18. Add keyboard F-key listener; on press (hint visible), emit `raise-dead` event with active grave ID. (Phase 1: Direct scene.launch instead of event)
- [x] 19. Listen for `raise-dead` event; call `this.scene.launch('ResurrectionRitual', ritualData)`. (Phase 1: Launched directly in tryRaiseGrave)

## Epitaph tooltip
- [x] 20. On pointer-over (desktop) or long-press (mobile) on any tombstone, show epitaph text in a speech-bubble Phaser Text container; hide on pointer-out / tap elsewhere. (Phase 1: Implemented as UIScene plaque with full grave info popup)

## Atmosphere
- [x] 21. Enable Phaser Light2D pipeline; set ambient colour `0x1a2340`; call `setPipeline('Light2D')` on all sprites. (Phase 1: ambient 0x5a6a96, was adjusted for readability)
- [x] 22. Add point light for wizard (warm white, radius 80, intensity 0.8); update light position each frame. (Phase 1: Added with 240 radius, 0.6 intensity)
- [x] 23. Place 6–8 jack-o'-lantern sprites; add orange point light (radius 160, intensity 1.2) at each. (Phase 1: Placed 10 pumpkins with lights)
- [x] 24. Create falling-leaf particle emitter using Kenney Particle Pack leaf texture.
- [x] 25. Add two `TileSprite` fog layers; scroll them in `update()` at differing speeds. (Phase 1: Added 3 fog layers)
- [x] 26. Add full-moon sprite to background layer (depth -2); add vignette post-FX to camera. (Phase 1: Added vignette to UIScene at alpha 0.7)

## Audio
- [x] 27. Add ambient audio files to `public/assets/audio/ambient/`; update CREDITS.md. (Phase 1: Already in public/assets/audio/)
- [x] 28. Implement AudioContext unlock on first user click/touch; start `wind-howl` loop at volume 0.4. (Phase 1: Unlocked on TitleScene first click, wind at 0.3)
- [x] 29. Start `footsteps-gravel` loop when wizard moves; fade out 0.3 s when stopped. (Phase 1: Implemented with grass/gravel surface detection)
- [x] 30. Schedule random `owl-hoot` / `ghost-whisper` one-shots every 20–60 s. (Phase 1: Implemented via AudioManager.updateRandomShots)
- [x] 31. Add global mute toggle (M key / mute button in corner); persist preference in `localStorage`.

## Mobile
- [x] 32. Register `VirtualJoystickPlugin` in game config; show joystick + F button only when `navigator.maxTouchPoints > 0`.
- [x] 33. Map joystick force X/Y to wizard velocity in `update()`.
- [x] 34. Wire mobile F button to same `raise-dead` event as keyboard F key.

## Camera
- [x] 35. `cameras.main.startFollow(wizard, true, 0.1, 0.1)`.
- [x] 36. `cameras.main.setBounds(0, 0, 3200, 2400)`. (Phase 1: Set to 2400×1800 world size)
