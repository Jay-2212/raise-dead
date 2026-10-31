# Resurrection Ritual — Design

## Scene overview
`ResurrectionRitual extends Phaser.Scene` — launched additively over `GraveyardWorld` via `this.scene.launch('ResurrectionRitual', { graveId, graveName })`. Stopped (not destroyed) when the overlay opens; stopped again on exit.

## Entry ritual timeline (ms)
```
  0    → scene.launch, receive graveId/graveName
  0    → play incantation voice clip (AudioBuffer)
  0    → begin rune particle ring fade-in (1000 ms)
  500  → dim ambient audio to 0.15
 1500  → ramp wind-swell SFX from 0 → 1.0 (1500 ms)
 2000  → cameras.main.shake(800, 0.012)
 2000  → play stone-crack sprite animation on tombstone face
 3000  → cameras.main.flash(600, 255, 255, 255) + holy-light-burst SFX
 3600  → cameras.main.fadeOut(400, 255, 255, 255)
 4000  → pause GraveyardWorld; mount DOM overlay for graveId
 4000  → cameras.main.fadeIn(400)
 4400  → ritual complete; player in overlay
```

## Exit ritual timeline (ms)
```
  0    → player triggers exit
  0    → cameras.main.fadeOut(400, 255, 255, 255)
  400  → unmount DOM overlay
  400  → resume GraveyardWorld
  400  → cameras.main.fadeIn(400)
  800  → rune particles disperse (300 ms fade)
  800  → play tomb-seal SFX
  800  → ramp wind-swell from current → 0 (600 ms)
 1400  → restore ambient audio to 0.4
 1400  → stop ResurrectionRitual scene
```

## Rune glyph system
- 6 rune glyphs drawn as `Phaser.GameObjects.Text` objects using a custom rune/symbol font (OFL), orbiting the tombstone in a circle of radius 80 px.
- Each rune is assigned a random angular offset; all orbit at 0.5 rad/s clockwise.
- `alpha` tweened 0 → 1 on entry, 1 → 0 on exit via `scene.tweens.add`.

## Cancellation (Esc during entry)
- If Esc is pressed before `t = 3600`, kill all tweens, stop audio, play a 400 ms `fadeIn` from current state, restore ambient to 0.4, stop scene.
- A `cancelled` flag prevents the `4000 ms` callback from firing.

## DOM overlay mounting (`src/ui/GraveOverlay.ts`)
```typescript
class GraveOverlay {
  mount(graveId: string): void   // creates <div id="grave-overlay"> + lazy-imports grave module
  unmount(): void                // removes div, calls dispose() on grave module if present
}
```
- `graveId` maps to a dynamic import: `src/graves/${graveId}/index.ts`.
- The overlay div is appended to `#game-container`; CSS: `position: absolute; inset: 0; z-index: 10`.

## Grave module interface
```typescript
interface GraveApp {
  mount(container: HTMLElement): Promise<void>;
  dispose(): void;
}
```
All grave modules export a default `GraveApp` instance.

## Scene data contract
```typescript
interface RitualData {
  graveId: 'road-rash' | 'google-reader' | 'clippy' | 'winamp' | 'unmarked-grave';
  graveName: string;
  tombstoneWorldX: number;
  tombstoneWorldY: number;
}
```
