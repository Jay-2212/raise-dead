# Graveyard World — Design

## Scene overview
`GraveyardWorld extends Phaser.Scene` — the persistent "world" scene running at all times except during the resurrection overlay. Uses Arcade Physics for movement and collision; Light2D pipeline for atmosphere.

## Map layout
- World size: 3200 × 2400 px.
- Tileset: custom dark-ground tiles (CC0 or original art). Tile size: 32 × 32 px.
- 40 tombstone positions hand-authored in a `mapLayout.ts` config (grid rows of 8–10 stones with winding path in between). Sort_priority 1–5 (resurrectable) placed centrally along the main path at medium distance from spawn; sort_priority 6–40 fill the surrounding field.
- Wizard spawn: (400, 400) — top-left area.
- Decorative elements: 6–8 jack-o'-lanterns, 3 bare trees (static sprites), 1 full-moon sprite (background layer, static).

## Phaser scene lifecycle
```
create()
  loadGraves()       → parse graves.json, create Tombstone objects
  buildMap()         → tilemap + collision layer
  spawnWizard()      → Arcade Physics sprite
  setupCamera()      → follow wizard, world bounds
  setupLights()      → Light2D: ambient + jack-o'-lantern lights
  setupParticles()   → falling leaves + fog TileSprites
  setupAudio()       → AudioContext unlock → start ambient loop
  setupInput()       → keyboard cursors + F key; mobile joystick/button
  setupProximity()   → Arcade overlap zone per resurrectable grave

update(t, dt)
  moveWizard()
  checkProximity()   → show/hide "Press F" hint
  scrollFogLayers()  → fog parallax
```

## Tombstone component (`src/ui/Tombstone.ts`)
```typescript
class Tombstone extends Phaser.GameObjects.Container {
  sprite: Phaser.GameObjects.Sprite    // tombstone graphic
  nameText: Phaser.GameObjects.Text    // app name + years
  epitaphBubble?: Phaser.GameObjects.Container  // shown on proximity
  glowEmitter?: Phaser.GameObjects.Particles.ParticleEmitter  // resurrectable only
  constructor(scene, x, y, grave: GraveEntry)
}
```

## Proximity detection
- Each resurrectable tombstone has an `Arcade.StaticBody` trigger zone of radius 96 px.
- `scene.physics.add.overlap(wizard, triggerZones, onEnterGrave)` — fires once per enter.
- `onEnterGrave` sets `activeGrave` and shows `ProximityHint`.
- On overlap exit: hide hint, clear `activeGrave`.

## Movement
```typescript
const WALK_SPEED = 150; // px/s
const vel = new Phaser.Math.Vector2(dx, dy).normalize().scale(WALK_SPEED);
wizard.body.setVelocity(vel.x, vel.y);
```
Mobile: `VirtualJoystickPlugin.forceX / forceY` → same velocity calculation.

## Lighting
- `this.lights.enable().setAmbientColor(0x1a2340)` — deep blue moonlight.
- Wizard: `this.lights.addLight(wizard.x, wizard.y, 80, 0xffe8c0, 0.8)` — warm candle glow; updated each frame.
- Each jack-o'-lantern: `this.lights.addLight(x, y, 160, 0xff6a00, 1.2)`.
- All sprites use `sprite.setPipeline('Light2D')`.

## Particle systems
- **Falling leaves**: `this.add.particles(0, 0, 'leaf', { x: { min: 0, max: 3200 }, y: -10, speedY: { min: 30, max: 80 }, rotate: { min: 0, max: 360, onUpdate: true }, lifespan: 8000, frequency: 200, gravityY: 10 })`.
- **Fog**: two `TileSprite` layers at y=0, scrolled in `update()` at 0.05 and 0.09 px/frame; alpha 0.18 and 0.12.
- **Resurrectable grave glow**: small additive-blend green spark emitter, burst 3 on 2-s cycle.

## Audio
- `wind-howl`: looping, volume 0.4.
- `footsteps-gravel`: looping, play on move, fade out 0.3 s on stop.
- `owl-hoot`, `ghost-whisper`: random timer 20–60 s, pan slightly random.
- All audio: respect global mute flag stored in `localStorage`.

## Mobile layout
- Joystick rendered at (120, viewport.height - 120), radius 60.
- F button at (viewport.width - 80, viewport.height - 100), 60 × 60 px.
- Both hidden on pointer device detection (`!navigator.maxTouchPoints`).
