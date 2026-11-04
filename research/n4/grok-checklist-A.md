I'll read the N4 draft and the files you named, then write a mechanical checklist with line anchors for B1, B2, Z1–Z6, L1, and M1–M4.The draft pins B1 on proximity state after a ritual. I'll trace that path and the ambient, wave, and map code next.B1 is confirmed. The null write is line 151, and it sticks because the wizard is parked at exactly `PROX_DIST`.

## B1 root cause — confirmed

`ritualFullyEnded` sets `lastProxGraveId = null` at `GraveyardWorld.ts:151` and leaves `activeGrave` (`:65`) untouched. `tryRaiseGrave` parks the wizard at `ts.x, ts.y + 40` (`:913–914`). `PROX_DIST` is 40 (`:19`) and the test is strict `<` (`:1098`), so the next `checkProximity` gets `newId === null`. `null !== null` is false (`:1105`), so `:1106–1107` never assign and `activeGrave` stays on the grave just raised. The zombie hand is `(1400, 1612)` with radius 44 (`eggDefinitions.ts:82–86`); the nearest resurrectable is hundreds of pixels away, so F hits Priority 1 (`interact` `:879–882`) and `tryRaiseGrave` teleports the wizard back onto that stone. Jay seeing Road Rash matches `road-rash` at `(1110, 1045)`.

Clearing `activeGrave` at `:151` fixes the stuck pointer. Also emit `proximityChanged`/`plaqueChanged` null there, because with both ids null `checkProximity` will not emit. `interact` must call `checkProximity()` only after the wave guard. Compare distances only among hits inside their own radii: grave ≤ 40 to the stone base, egg < `egg.radius`. The closer one wins. Hand and graves do not overlap today; this is future-proofing. `CreditsScene.ts:191–194` nulls `lastProxGraveId` only. Same desync, and it does not cause this bug, because credits pauses movement. Null `activeGrave` there too.

## Plan corrections

- Overlap bug is `WitchFlyBy.forceSpawn` (`:81–87`): it `cleanup()`s the live witch, then spawns another. `doBlackCat` calls that via `summonWitch` (`EasterEggManager.ts:279`, `GraveyardWorld.ts:863–865`).
- A random witch’s first timer is 12–20 s then 35–75 s (`WitchFlyBy.ts:46, 58`). Use one 45–120 s timer measured from release. An extra 40 s gap on top stacks.
- Ritual and the wave must still start while a witch is up. Force-lock and dismiss the witch. A cat omen waits until the witch has left. It does not kill her.
- `google-reader` is `resurrectable: false` (`data/graves.json:81`). Raiseable graves are 7: space-cadet, 3d-pipes, bouncing-logo, road-rash, clippy, winamp, unmarked-grave. Secrets are 7 (`EGG_DEFINITIONS`). Counter is computed `n/total`, which is 7/7 today.
- No graves sit by the hand. Spawn at the three points below. No staff sprite. Green light is `wizardLight` (`:662–664`, color `0x9fc8ff`) plus a follow sprite. No horde-scream or thunder files exist. No L4D audio. `cast()` auto-targets within 340 (`ZombieWave.ts:22, 182–188`). Any click during a wave calls that (`GraveyardWorld.ts:818`). Touch returns at `:817` before that, so taps do nothing. Fast zombies are already 1 HP (`ZombieWave.ts:111`). The secret is saved when the hand is touched (`EasterEggManager.ts:234–238`), before the wave ends. `chant_drone_loop` plays over `moonlit_lullaby` with no duck. `audio` is private (`:75`).
- Cat area trigger is not gated by the wave (`EasterEggManager.ts:121–129`). `eggManager.update` still runs (`GraveyardWorld.ts:933`).
- Retry and the full map must be UIScene widgets. The world camera zoom is 2 (`:651`), so a scrollFactor-0 button on the world is the wrong hit target.
- Hop tweens fight the arcade body. Zero velocity for 180 ms.
- `disableContextMenu()` on the game canvas only. The grave overlay is DOM outside the canvas.

## Checklist

**B1 — `GraveyardWorld.ts`**

- `:145–154`: set `activeGrave = null`, emit `proximityChanged` null and `plaqueChanged` null. Keep `lastProxGraveId = null`.
- `interact` `:869`: order is ritual guard (`:871`), then `zombieWave.active` → `castCone(this.facing)` and return, then `if (this.mapOpen) return`, then `checkProximity()`, then distance contest, then `tryRaiseGrave` or `tryInteract`.
- Add `graveDistance(): number` (Infinity if no `activeGrave`).
- `EasterEggManager`: make `nearestInteractable` return `{ egg, dist } | null` (public `nearestEgg()`). `tryInteract` stays boolean.
- `CreditsScene.ts:193`: also set `activeGrave = null`.
- Edge: wave branch stays first so F still casts. `raiseGrave` (`:1195`) still sets `activeGrave` on purpose. Overlay pauses the world at `ResurrectionRitual.ts:406`, so F is dead until `ritualFullyEnded`. Cancel (`:583`) and success (`:518`) both hit the handler. Success passes `ritualData.graveId`. Cancel passes nothing.

**B2 — new `src/scenes/AmbientEventDirector.ts`**

```ts
kind: 'witch' | 'omen' | 'wave' | 'ritual' | null
constructor(scene: Phaser.Scene)
get busy(): boolean
canStartOmen(): boolean          // kind === null
lock(kind): boolean              // false if busy
forceLock(kind: 'wave' | 'ritual'): void
release(kind): void              // nextWitchAt = now + Between(45000, 120000)
update(): void                   // if !busy && now >= nextWitchAt → lock('witch'); witch.spawnNow()
```

Construct at `GraveyardWorld.ts:132`. `update` order: `eggManager.update`, `director.update`, `witch.update`, `zombieWave.update`.

`WitchFlyBy`: delete the self-timer (`:52–67`). `forceSpawn` becomes `requestSpawn()` (`pending = true`, no `cleanup`). `update`: if `pending && !active && !isSuppressed() && !isCrowActive()` then `spawnWitch`. `cleanup` calls `onDone`. `spawnNow` (`:74`) stays immediate and does nothing if `active`. `dismiss()` is `cleanup` with no `onDone`.

- Random witch: director `lock('witch')` + `spawnNow`. `onDone` → `release('witch')`.
- Cat: in the area loop, if `!director.canStartOmen()` then `continue` and do not set the 45 s cooldown. Else cooldown, `lock('omen')`, `trigger`. `doBlackCat` calls `requestSpawn` after lightning `onDone`, not `summonWitch`. Witch `onDone` → `release('omen')` only if `kind === 'omen'`.
- Wave `start` and `tryRaiseGrave`: `forceLock`, `witch.dismiss()`, `eggManager.cancelAmbient()`. Release on wave `end`/`retry` stays locked, and on `ritualFullyEnded`.
- `updateCrow` `:1140`: also require `!director.busy`.
- `cancelAmbient()`: stop black-cat timers, destroy cat, shadow, and flash, `lightning.cancel()`, `busy.delete('black_cat')`. Leave `zombie_hand` busy alone.
- First witch is 45–120 s from `create`, not 12 s. Crow may overlap a cat. It may not overlap witch, wave, omen, or ritual.

**L1 — new `src/easter/LightningStrike.ts`**

```ts
play(x: number, y: number, onDone: () => void): void
cancel(): void
```

Replace the flash in `doBlackCat` `:267–278`. Keep the cat tween `:262`. Count is 1 or 2 (50/50), gap 760 ms. Point: random angle, dist `Between(60, 110)` from the wizard, clamp to physics bounds `(16..2384, 16..1784)`. If the clamp leaves hypot < 60, push back out to 60. If still < 60, skip that bolt. Pre-flash 300 ms: full-screen rect, scrollFactor 0, depth 12000, white, alpha 0.85 by 60 ms, gone by 300 ms. Bolt: `Graphics`, 7 segments, ±16 px jitter, 3 branches length 30–50, line width 2, color `0xdfe8ff`, visible 160 ms, from `(impact.x ± 20, impact.y - Between(180, 260))`. Sparks: 8 `firefly_dot` ADD, same as `ZombieWave.burst`. Shake 220 ms / 0.005. Scorch: filled ellipse 22×8, `0x140e0a`, alpha 0.65, depth `impact.y - 3`, tween alpha 0 over 25000 ms, destroy. Sound: `thunder_1` or `thunder_2` if cached, else `stone_crack_crumble` at 0.4, plus `ground_rumble` at 0.7 delayed 80 ms. Load both keys in `worldAssets.ts` (CC0). `GraveyardWorld.flinch()`: `flinchUntil = now + 180`, and `moveWizard` sets velocity 0 while `time.now < flinchUntil`. Text `!` at `(wizard.x, wizard.y - 78)`, depth 99999, rise 16 px, fade 700 ms. Each `delayedCall` bails if `ritualActive` or `cancel`. `onDone` is what queues the omen witch.

**Z1–Z6 — rewrite `ZombieWave.ts`**

Constants: `WAVE_COUNTS = [6, 8, 10]`, speeds `[28–42, 40–58, 56–78]`, `SPAWN_POINTS = [(1180,1560), (1280,1460), (1620,1540)]`, stagger 380 ms, first delay 700 ms, all `hp = 2`, `CONE_RANGE = 140`, `CONE_DEG = 28`, `CAST_COOLDOWN = 230`, click radius 28 around `(sprite.x, sprite.y - 22)`, crit radius 10 around `(sprite.x, sprite.y - 36)` deals 2, touch bump stays `< 18`, knockback 34, zombie hit cooldown 900, `SOULS = 3`, `IFRAMES_MS = 1000`. Delete `RANGE = 340` and the nearest-in-range loop.

- `start`: `startedAt = time.now` once. Shake 600/0.006. `horde_scream` if cached, else `zombie_rise` 0.85 and `wolf_howl` 0.3. `audio.duckMusic(0.04, 400)` after making `audio` public. Chant loop as now (`:55–58`). Emit UIScene `hordeVignette` true and `soulsChanged` 3. Banner title `THE HORDE RISES`. `keyboard.off('keydown-SPACE', onSpace)` then `on`. Spawn wave 0. Next wave only when `spawned === count && every dead`.
- `castAt(wx, wy)`: bolt from `(wizard.x, wizard.y - 30)` to the nearest zombie inside 28 px, else to the point and fizzle. Hit: tint flash 70 ms, knock 14 px, `hp -= crit ? 2 : 1`, `kill` at ≤ 0. `castCone(facing)`: nearest living zombie with dist ≤ 140 and angle ≤ 28° of down `(0,1)`, up `(0,-1)`, left `(-1,0)`, right `(1,0)`. Else fizzle 40 px along facing. Both respect `castReadyAt`. `failed` short-circuits both.
- `bump`: if `now < iframesUntil` return. Else `souls--`, `iframesUntil = now + 1000`, existing knockback, emit `soulsChanged`. Blink wizard alpha 0.45/1 every 80 ms during i-frames. Restore alpha 1 on end. At 0 souls: `failed = true`, freeze movement, do not `end()`, emit `hordeDown`. No lore, no `onDone`.
- `retry()`: destroy zombies and bolts, `souls = 3`, `failed = false`, emit `soulsChanged`, `beginWave(0)`. Keep `startedAt` and the director lock. Stop the old chant before starting another.
- `end`: `off` SPACE, fade chant, `restoreMusic()`, emit `hordeVignette` false, banner `The graveyard rests` plus `m:ss` from `startedAt`. Then `active = false`, `release('wave')`, `onDone()`.
- Clear sets `localStorage rd_slayer = '1'` and `applySlayerGlow()`: `wizardLight` color `0x5dff9a`, intensity 0.95, plus `glow_moon` ADD tint `0x5dff9a`, alpha 0.55, scale 0.35, depth `wizard.y + 1`, offset `(-6, -28)`, follow it beside the shadow update (`:941`). `spawnWizard` applies this if the key is set.
- `doZombieHand`: skip `commitFound` inside `trigger` for this id. Call `commitFound('zombie_hand')` inside the wave `onDone`, then the existing lore card. Extract the `:234–245` block into `commitFound`.
- `GraveyardWorld` pointer `:816`: if ritual active, return. If `mapOpen`, return. If wave active, `castAt(p.worldX, p.worldY)` and return (left and right, including touch). Then the old `wasTouch` / `over` return. Do not `setInteractive` on zombies. `setupInput`: `this.input.mouse?.disableContextMenu()`.
- UIScene: red vignette, same texture as `:43`, tint `0xff2244`, depth 91, three yoyo pulses 280 ms to alpha 0.45, then hold 0.18 until `hordeVignette` false. Hearts at `(width/2, 36)`, depth 120, text `♥` × souls, color `#e85a6b`. `hordeDown`: button `Try again` 200×48 at center, depth 260, calls `zombieWave.retry()`. F button (`UIScene.ts:114`) already calls `interact` → cone. Joystick stays hidden during ritual and overlay (`:151, :160`).

**M1–M4**

- New `src/ui/WorldMap.ts`, owned by UIScene. `toggleMinimap()`, `toggleFull()`, `get fullOpen`, `closeFull()`, `update(wizard, raisedIds, foundEggIds, graves)`.
- Minimap panel 180×120, depth 110. Desktop `(width - 196, height - 136)`. Touch (`joystick.active`) `(width - 196, height - 320)` so it clears the F button at `(width - 140, height - 140)` (`Joystick.ts:63–65`). Draw `PATH_RECTS` once. Wizard dot 3 px `#fff2c4` each frame. Resurrectable graves only: raised `#7fd1d8`, unraised `#3a4a55`, 3 px. Scale `168/2400` by `112/1800`. N toggles. Persist `rd_minimap` `'0'` hidden, default shown. M stays mute (`:806, :841`).
- Full map: text button `Map` at `(12, 36)` under Credits (`:92`). Keys `J` and `Tab` (`preventDefault`) on GraveyardWorld, ignored when `ritualActive`, wave active, or `ResurrectionRitual` is active. Esc closes (`ResurrectionRitual.ts:135` is the ritual cancel). Dim rect plus panel depth 250. `mapOpen` on GraveyardWorld makes `moveWizard` return before velocity. Do not pause the scene. Regions go in `mapLayout.ts` as `MAP_REGIONS`: Central Plaza `(960,620,620×500)`, Crypt `(500,840)` egg `crypt_knock`, West Path `(760,790)` `black_cat`, Pumpkin Patch `(880,1040)` `jack_pumpkin`, East Stones `(2060,720)` `grave_13`, Well `(2060,400)` `mirror_well`, Moon Hill `(960,1560)` `moon_howl`, Zombie Field `(1240,1480)` `zombie_hand`. Found eggs: icon at real `x,y`. Unfound: `?` at the region center only. Label every region. Graves: exact dots, raised vs not. Caption `Graves raised n/t · Secrets f/7`.
- M3: `rd_raised` JSON string array, try/catch like `rd_eggs_found`. `markRaised(id)` on `ritualFullyEnded` only when the id argument is a string. `exitCleanup` emits the id. `cancel` emits none. Load in `create` after `buildTombstones`. Emit `raisedChanged`.
- M4: `SPRINT_MULT = 1.65` so speed is 148.5. Shift via `KeyCodes.SHIFT`. Joystick sprint when `hypot(forceX, forceY) >= 0.85` (`Joystick.getForce` is −1..1, radius 60). `updateFootsteps(delta, moving, surface, sprint)` uses interval 0.20 s when sprinting, else 0.33 (`AudioManager.ts:19, 165`). Dust: `kenney_smoke_04` every 160 ms at the feet, depth `wizard.y - 1`, scale 0.08, fade 400 ms, only if the texture exists. Click-to-move epsilon at `:988` must use the same speed value. `moveWizard` already returns on `ritualActive` (`:957`). Sprint does not run while `mapOpen` or `flinchUntil`.
