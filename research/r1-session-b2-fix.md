# Review round 1 — Kiro Session B2-fix (preload split regression)

Session B2's preload split broke the game in the production build (`npm run build` + `vite preview`). Headless console:
- `Texture "wizard_walk_down" not found` (and every other wizard_* sheet), then `TypeError: Cannot read properties of undefined (reading 'duration')`.
- Pressing Enter/clicking on the title never enters the graveyard.
Cause: `TitleScene` calls `preloadScene.loadWorldAssets()`, but PreloadScene has already been stopped by `scene.start('TitleScene')`, so its LoaderPlugin never runs; the animations in `PreloadScene.createAnimations()` are created before their textures exist; `enterGraveyard()` waits forever.

Fix (keep the split, make it robust):
1. Move the world/ritual asset lists into a shared module, e.g. `src/scenes/worldAssets.ts` exporting `queueWorldAssets(load: Phaser.Loader.LoaderPlugin)` and `createWizardAnimations(scene: Phaser.Scene)` (create each anim only if `!scene.anims.exists(key)`).
2. `TitleScene.create()` calls `queueWorldAssets(this.load)`, listens to `this.load.on('progress')` for the progress text and `this.load.once('complete')` to call `createWizardAnimations(this)` and set `this.registry.set('worldLoaded', true)`, then `this.load.start()`.
3. `GraveyardWorld.preload()` also calls `queueWorldAssets(this.load)` (Phaser skips keys already in cache, so it is instant after the title) and `GraveyardWorld.create()` calls `createWizardAnimations(this)` first. This also makes `__RD.goto('GraveyardWorld')` and direct starts safe.
4. `enterGraveyard()`: if `registry.get('worldLoaded')` is true, enter immediately; otherwise show "Summoning… NN%" and enter on the TitleScene loader's `complete`. Make sure it can never hang (if the load already completed before the listener was attached, enter right away).
5. Remove the now-unused `loadWorldAssets` from PreloadScene and fix the `'duration'` TypeError at its source (likely an anim or sound looked up before load) with a null guard.

Do not touch assets/, public/assets/, research/. Run `npm run build` until it passes. Summarise the changes.
