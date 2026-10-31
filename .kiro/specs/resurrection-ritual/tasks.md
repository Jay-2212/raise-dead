# Resurrection Ritual — Tasks

## Scene scaffolding
- [x] 1. Create `src/scenes/ResurrectionRitual.ts` extending `Phaser.Scene` with key `'ResurrectionRitual'`; register it in `GAME_CONFIG.scene`.
- [x] 2. Define `RitualData` interface in `src/types/ritual.ts`: `{ graveId, graveName, tombstoneWorldX, tombstoneWorldY }`.
- [x] 3. In `create()`, receive `this.scene.settings.data as RitualData`; store for use in timeline. (Phase 1: Used init(initData) instead)

## DOM overlay system
- [x] 4. Create `src/ui/GraveOverlay.ts` — `GraveOverlay` class with `mount(graveId)` and `unmount()`.
- [x] 5. In `mount()`, dynamic-import `src/graves/${graveId}/index.ts`; call `app.mount(overlayDiv)`. (Phase 1: Phase 2 placeholder; dynamic import wrapped in try-catch)
- [x] 6. Overlay div: `position: absolute; inset: 0; z-index: 10; background: #1a1a2e;` on `#game-container`.
- [x] 7. In `unmount()`, call `app.dispose()`; remove overlay div from DOM.

## Entry ritual timeline
- [x] 8. Add incantation voice clip to `public/assets/voice/incantation.mp3`; update CREDITS.md. (Phase 1: Multiple incant_*.mp3 files per grave, already in public/assets/voice/)
- [x] 9. Add `wind-swell.mp3`, `holy-light-burst.mp3`, `tomb-seal.mp3` to `public/assets/audio/sfx/`; update CREDITS.md. (Phase 1: Already in public/assets/audio/exorcism/)
- [x] 10. Implement `playEntryRitual()` method using `this.time.delayedCall` sequence: (Phase 1: Implemented in startRitual method with all timeline points)
  - t=0: play `incantation`; begin rune fade-in tween. ✓
  - t=500: tween ambient audio volume to 0.15. ✓
  - t=1500: tween `wind-swell` from 0 → 1.0 over 1500 ms. ✓
  - t=2000: `cameras.main.shake(800, 0.012)`; play stone-crack animation. ✓
  - t=3000: `cameras.main.flash(600, 255,255,255)`; play `holy-light-burst`. ✓ (via holyBurst sprite scale + white fill)
  - t=3600: `cameras.main.fadeOut(400, 255,255,255)`. ✓
  - t=4000: `GraveyardWorld.scene.pause()`; `graveOverlay.mount(graveId)`; `cameras.main.fadeIn(400)`. ✓

## Rune glyphs
- [x] 11. Load a rune/glyph font (OFL) in `PreloadScene`; store at `public/assets/fonts/`. (Phase 1: Rune circle sprite used instead of font; no custom font needed)
- [x] 12. In `ResurrectionRitual.create()`, create 6 `Phaser.GameObjects.Text` rune glyphs at orbit positions around tombstone world coords (converted to screen coords via camera). (Phase 1: Used rune_circle_add sprite that rotates)
- [x] 13. Tween each rune alpha 0→1 over 1000 ms with stagger 100 ms. (Phase 1: Rune circle scales in 800ms)
- [x] 14. In `update()`, rotate each rune's orbit angle by `0.0008 * delta` radians; update position. (Phase 1: Continuous 10°/s rotation via tween)

## Stone crack animation
- [x] 15. Create stone-crack sprite sheet (3–4 frames) in `public/assets/images/stone-crack.png`; update CREDITS.md. (Phase 1: Used tomb_cracked and tomb_rubble state sprites instead)
- [x] 16. In ritual at t=2000, spawn crack sprite at tombstone screen position; play animation once. (Phase 1: Swapped stone state at stoneSwapAt time point)

## Cancellation (Esc during entry)
- [x] 17. Add Esc key listener in `ResurrectionRitual.create()`.
- [x] 18. On Esc (before t=3600): set `cancelled = true`; kill all tweens and delayed calls; stop all ritual audio; `cameras.main.fadeIn(400)`; restore ambient to 0.4; `this.scene.stop('ResurrectionRitual')`.

## Exit ritual
- [x] 19. Export `startExitRitual()` function (called by overlay's "Requiescat in pace" button via event).
- [x] 20. Implement exit sequence: `cameras.main.fadeOut(400)` → unmount overlay → `GraveyardWorld.scene.resume()` → `cameras.main.fadeIn(400)` → disperse runes → play `tomb-seal` → ramp wind-swell to 0 → restore ambient → `this.scene.stop()`. (Phase 1: Implemented with simpler sequence but same outcomes)

## Wiring
- [x] 21. Add `'ResurrectionRitual'` to scene list in `GAME_CONFIG`.
- [x] 22. In `GraveyardWorld`, listen for the `raise-dead` event and call `this.scene.launch('ResurrectionRitual', ritualData)`. (Phase 1: Direct launch in tryRaiseGrave)
- [x] 23. In `ResurrectionRitual`, listen for a `rip-exit` custom DOM event dispatched by overlay buttons. ✓
