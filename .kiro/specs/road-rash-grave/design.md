# Road Rash Grave — Design

## Module entry point
`src/graves/roadrash/index.ts` exports a `GraveApp` that mounts a `<canvas>` into the overlay container and starts the road engine.

## Engine: javascript-racer (MIT code only)
- Vendor `src/v4.final/` logic into `src/graves/roadrash/engine/` as TypeScript modules.
- Delete all `images/` and `music/` from the vendored copy.
- Retain: `utils.js`, `render.js`, `game.js` (road segment math, draw functions, car management).
- Wrap in a single `RoadEngine` class that accepts a `HTMLCanvasElement` and a `RoadConfig`.

## Sprite sheet layout (original art, all frames 64 × 64 px)
```
player-bike.png
  row 0: straight (idle)
  row 1: lean left
  row 2: lean right
  row 3: punch left
  row 4: kick right
  row 5: hit (recoil)
  row 6: crash (flying off)

rival-bike-red.png   (same rows as player)
rival-bike-blue.png
```
Sprite generation approach: Muse Image batch prompt OR Kenney Motorbike CC0 base (if available and verified CC0).

## Rival biker data model
```typescript
interface RivalBiker {
  z: number;          // position along track (0–trackLength)
  offset: number;     // lateral: -1 (left edge) to +1 (right edge)
  speed: number;      // current speed fraction (0–1)
  baseSpeed: number;  // target speed
  state: 'riding' | 'punching' | 'kicking' | 'hit' | 'crashed';
  stateTimer: number; // ms remaining in current state
  respawnTimer: number;
}
```

## Combat logic
```
onPunchKey():
  if |rival.z - player.z| < PUNCH_Z_RANGE (300)
  && |rival.offset - player.offset| < 0.3:
    rival.state = 'hit'
    rival.stateTimer = 800
    rival.offset += (rival.offset > player.offset ? 0.4 : -0.4)
    rival.speed *= 0.7

onRivalCrash(rival):
  rival.state = 'crashed'
  rival.respawnTimer = 5000
  scheduleRespawn(rival)
```

## HUD elements
- Top-left: lap counter (e.g. `Lap 2 / 3`).
- Top-right: timer `MM:SS.mm`.
- Center (flash): `ROUND START` at race begin; `FINISH!` on completion.
- Always: "Requiescat in pace" button (top bar outside canvas).

## Audio
- `komiku-battle.mp3` — main loop.
- `engine-loop.mp3` (original recording or CC0 SFX) — pitch-shift with `AudioContext.playbackRate` proportional to `player.speed`.
- `punch.wav`, `kick.wav`, `crash.wav` — one-shots on combat events.

## Iframe vs inline canvas decision
Inline `<canvas>` inside the overlay div — no iframe needed. The engine is vendored TypeScript and runs in the same JS context (no cross-origin issues).

## File list (to create)
```
src/graves/roadrash/
  index.ts           GraveApp implementation
  engine/            vendored javascript-racer TS modules
  RivalBiker.ts
  Hud.ts
  controls.ts        keyboard + touch controls
```
