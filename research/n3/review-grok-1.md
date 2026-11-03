I'll read the night plan, the proposed Easter-egg diff, and the current scene, overlay, and auth sources so the review can name exact bugs and replacements.The diff is in. Next I’ll match it against the live world, overlay, map, and Clicky token path so each bug has a line and a replacement.The working tree has already drifted from `k1.diff`. Do not `git apply` it. Overwrite `src/easter/EasterEggManager.ts` with the **diff** copy (it has `readonly defs`; `research/n3/EasterEggManager.ts` does not, so `__RD.eggs()` throws). Line numbers below are the diff’s new file. `worldAssets.ts` and `eggDefinitions.ts` are already applied.

## 1. Runtime bugs

**Cat is drawn behind the wizard.** `EasterEggManager.ts:223` and `:227`. `y = wiz.y - 18` and `setDepth(y)` sit inside the 64px wizard (depth is `wizard.y`, updated every frame).

```ts
const y = wiz.y - 4;
const startX = wiz.x - dir * 90;
const endX = wiz.x + dir * 90;
const cat = w.add.sprite(startX, y, 'black_cat_walk')
  .setOrigin(0.5, 1).setDepth(wiz.y + 8).setFlipX(dir < 0);
```

**Every egg retriggers.** Area check (`:109`) and moon check (`:117`) ignore `foundIds`. `trigger` (`:190`) always runs the sequence. Moon howls every 2.5s of standing still. Pumpkin (`:263`) allocates a new `glow_warm` forever. Cat (`:238`) fires lightning + `summonWitch()` every 45s. `spawnNow()` no-ops if a witch is already up, so the omen often has no witch.

```ts
trigger(eggId: string): void {
  const egg = getEggById(eggId);
  if (!egg || this.busy.has(eggId)) return;
  const ui = this.world.scene.get('UIScene');
  if (this.foundIds.has(eggId)) {
    ui?.events.emit('showLoreCard', egg.title, egg.text, egg.iconKey ?? egg.spriteKey);
    return;
  }
  // ...existing switch + foundIds add...
  this.world.time.delayedCall(eggId === 'black_cat' ? 9500 : 900, () => {
    if (this.world.scene.isActive('ResurrectionRitual')) return;
    ui?.events.emit('showLoreCard', egg.title, egg.text, egg.iconKey ?? egg.spriteKey);
  });
}
```

In the area loop and the moon block, add `if (this.foundIds.has(egg.id)) continue`. Held F completes the well: key repeat delivers 3 `keydown-F`s inside 4s. `GraveyardWorld.ts:803`:

```ts
this.input.keyboard!.on('keydown-F', (ev: KeyboardEvent) => {
  if (ev.repeat) return;
  this.interact();
});
```

**Second lore card is dropped.** `UIScene.ts:397` `if (this.loreCardVisible) return`. Cat lore is up for 9s, so the next find is saved and never shown. Delete that return. Always rewrite the text and restart one `this.time.delayedCall(9000, ...)`.

**Hint dies after a ritual.** `ritualStarted` hides the text, but `lastHint` is unchanged, so `emitHint` will not emit again.

```ts
clearHint(): void { this.lastHint = '\u0000'; }
```

Call `this.eggManager.clearHint()` from `ritualFullyEnded`.

**These three calls are still wrong in the tree** (the diff does not match it):

```ts
public wizard!: Phaser.Physics.Arcade.Sprite;          // :34, else tsc fails
this.eggManager = new EasterEggManager(this, this.treeColliders); // :134
this.eggManager?.tryInteract();                        // :836, not tryInteract(this.wizard)
if (!this.ritualActive) this.eggManager?.update(delta); // after :882
```

`scene.isActive('GraveOverlay')` (`:827`) is always false. Overlay is a DOM object. `ritualActive` is the real guard. Delete that line.

Jack glow (`:263`): add `.setBlendMode(Phaser.BlendModes.ADD).setTint(0xf08a24)`.

## 2. Gameplay

Paths are `PATH_RECTS`. Trees that matter are listed in `spawnDecoratives`.

| Egg | Now | Problem | Put it |
|---|---|---|---|
| black_cat | (420, 900) r40 | On the west spine `x200–1120, y870–918`. Keep. | same |
| jack_pumpkin | (680, 1180) r34 | Radius only kisses the y1119 strip. Grave row is 100px north. | **(980, 1134) r40** |
| grave_13 | (2080, 1520) | No path within 400px. | **(2108, 820) r40** on the east connector `x2080–2136, y720–1100` |
| crypt | (200, 640) | 120px west of the x320 path. | **(600, 930) r56**, collider south of the spine (spine ends y918) |
| well | (2230, 560) | 94px east of the connector. A 28px body on the 56px path would seal it. | **(2172, 500) r72**, body stays east of x2136 |
| moon | (980, 1690) r30 | 10px overlap with the clearing link. Pool is created only on trigger at depth `y-50` (1640), so it y-sorts over the ground. | **(1088, 1680) r48** |

Draw the pool in `placeProps`, then `continue`:

```ts
if (egg.id === 'moon_howl') {
  this.moonPool = w.add.image(egg.x, egg.y, 'glow_moon')
    .setTint(0xbfd8ff).setBlendMode(Phaser.BlendModes.ADD)
    .setScale(1.6).setAlpha(0.25).setDepth(-8);
  continue;
}
```

Use `tomb_deco_cross`, not `tomb_cracked` (`:72`). Grave hint must win. `computeHint` returns null when `nearResurrectable()` is true. Drive the existing `ProximityHint` (it already sits at (640, 650)). The diff’s second label at `height - 64` is the same spot.

```ts
// UIScene, both proximityChanged and eggHint call this
const raw = this.graveHint ?? this.eggHint;
if (!raw) { this.hint.hide(); return; }
this.hint.setText(this.joystick.active ? raw.replaceAll('Press F', 'Tap F') : raw);
this.hint.show();
```

Hide the card after walking 90px: store `{x, y}` when lore shows; in `update`, if distance > 90, emit `hideLoreCard`.

Omen timing: cat 1.5s, flash at 1.7s, witch at 2.4s, lore at 2.6s. The card is ~400px tall from y=24 and covers the witch band (`worldView.top + 30…90`). Lore delay **9500**. Force the flyby:

```ts
forceSpawn(): void {
  if (this.active) this.cleanup(); // null sprite/tweens before stop()
  this.timer = 0;
  this.interval = Phaser.Math.Between(35000, 75000);
  this.spawnWitch();
}
```

`summonWitch` calls `forceSpawn`, not `spawnNow`.

**Touch.** The F button is already at `(width - 140, height - 140)` (`Joystick.ts:63`). It calls `tryRaiseGrave` (`UIScene.ts:96`), and the diff never changes that, so eggs never fire on a phone.

```ts
this.joystick.onFPress(() => {
  (this.scene.get('GraveyardWorld') as { interact?: () => void }).interact?.();
});
```

Well copy: `Tap F three times to peer into the well` plus `(n/3)` only when `n > 0`.

## 3. K2

`GraveEntry.game?: string` as `games/<slug>/index.html`. In `mount()`, if `grave.game`, build this and return. No `allow-same-origin`.

```ts
iframe.src = baseUrl + grave.game;
iframe.sandbox = 'allow-scripts allow-pointer-lock'; // nothing else
iframe.referrerPolicy = 'no-referrer';
iframe.style.cssText = 'width:100%;height:100%;border:0';
iframe.addEventListener('load', () => iframe.contentWindow?.focus());
```

Wrap at `width: min(96vw, calc(92vh * 16 / 9)); aspect-ratio: 16/9`. Button text `Rest in peace`, `click` + `touchend` → `triggerExit()`. Credits line under the frame from `grave.note`. One line: `Best on a keyboard.` Pinball/Contra get no on-screen keys tonight.

Esc: the parent `document` listener already in `GraveOverlay` runs only when the iframe is not focused. Cross-origin, you cannot listen inside the frame. First Esc exits pointer lock and is swallowed by the browser. The button is the exit. On `unmount`, `enableGlobalCapture()` and `this.gameScene.game.canvas.focus()`.

`public/_headers`, after the `/*` block (confirm with `curl -I` that only one CSP comes back; two CSP headers are ANDed):

```
/games/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: data:; font-src 'self' data:; connect-src 'none'; worker-src 'self' blob:; frame-src 'none'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'none'
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
```

Parent `frame-src 'self'` already allows the iframe. Games must be classic scripts, not `type="module"` (an opaque frame cannot import modules without CORS).

**Clicky.** Two copies. `functions/api/clicky/session.ts:86` sets `rd_ck` as `HttpOnly; Secure; SameSite=Strict; Path=/api/clicky`. JS cannot read that cookie. `src/graves/clippy/api.ts:21-40` and `:60-63` also store the JSON `token` in `localStorage['rd_clicky_token']` and send `X-Clicky-Token`. POST with no `Origin` is rejected (`_lib.ts:150`). A same-origin iframe does not need to steal anything: it is the site, so `parent.fetch('/api/clicky/chat', {credentials:'include'})` sends the cookie, and the parent CSP is `connect-src 'self'`. The game’s own `connect-src 'none'` does not apply to `parent.fetch`. Quota is burnable. `allow-same-origin` is a no. Unmarked AI HTML must stay `sandbox="allow-scripts"` with no same-origin. Srcdoc also inherits `script-src 'self'`, so inline AI script will not run. Do not build K3 that way.

South ring, clear of the five stones and of jack at (980, 1134): **pipes (860, 1104), space-cadet (1160, 1104), contra (1480, 1104).** Medal fallback `medal_unmarked`. `incant_generic` is already loaded.

## 4. Do not spend Kiro on this

* `git apply research/n3/k1.diff` will fail. `worldAssets.ts`, `eggDefinitions.ts`, and half of `GraveyardWorld` / `UIScene` are already in the tree and do not match the hunks. One session, six edits above, then `npm run build` once.
* Do not paste `research/n3/EasterEggManager.ts`. It has no `defs`.
* Kiro does not vendor, license-check, or rewrite games. Hark drops one classic-script build in `public/games/<slug>/`. Pipes first, Contra second. Skip star-cadet unless the bundle already exists. Do not send Kiro to verify the Windows 7 pipes date.
* No K3. No K4 walking pass. No CREDITS archaeology. Hark writes those three rows from `research/p15-brief.md:124`.
* Debug `eggs()` is ten lines. Ship it. Skip `__RD.triggerEgg` unless a screenshot script needs it.
