### 1. Concrete Runtime Bugs in `k1.diff` & `research/n3/`

#### Bug 1.1: `research/n3/EasterEggManager.ts` missing `defs` property (Runtime Crash on `__RD.eggs()`)
* **File & Line:** `research/n3/EasterEggManager.ts:25-35`
* **Cause:** `main.ts:462` accesses `m.defs.filter(...)`. In `k1.diff`, `readonly defs = EGG_DEFINITIONS;` was added, but in `research/n3/EasterEggManager.ts` it is missing. Step K1 tells Kiro to copy `research/n3/EasterEggManager.ts`. Doing so causes `TypeError: Cannot read properties of undefined (reading 'filter')`.
* **Exact Replacement:**
```typescript
// research/n3/EasterEggManager.ts:25
export class EasterEggManager {
  private world: World;
  readonly defs = EGG_DEFINITIONS;
  private foundIds = new Set<string>();
```

---

#### Bug 1.2: Duplicate methods & types in [UIScene.ts](file:///workspace/raise-dead/src/scenes/UIScene.ts#L18-L20) (`tsc` build break)
* **File & Line:** [UIScene.ts:18-20](file:///workspace/raise-dead/src/scenes/UIScene.ts#L18-L20) and [UIScene.ts:356-485](file:///workspace/raise-dead/src/scenes/UIScene.ts#L356-L485)
* **Cause:** `src/scenes/UIScene.ts` already contains partial implementations of `loreCard`, `loreCardHideTimer` (typed as `ReturnType<typeof setTimeout>`), `createLoreCard`, `showLoreCard`, `hideLoreCard`, and `onEggFound`. `k1.diff` attempts to append these identical names with `Phaser.Time.TimerEvent`. `git apply` will fail, or if forced, `npm run build` will fail with `TS2300: Duplicate identifier`.
* **Exact Replacement:**
Replace lines 18–20 in [UIScene.ts](file:///workspace/raise-dead/src/scenes/UIScene.ts#L18-L20):
```typescript
  private loreCard!: Phaser.GameObjects.Container | null;
  private loreCardVisible = false;
  private secretsCounter!: Phaser.GameObjects.Text;
  private loreCardHideTimer: Phaser.Time.TimerEvent | null = null;
  private eggHintText!: Phaser.GameObjects.Text;
```
And replace lines 356–485 in [UIScene.ts](file:///workspace/raise-dead/src/scenes/UIScene.ts#L356-L485) with the single clean implementation from `k1.diff`.

---

#### Bug 1.3: Mobile touch bypasses Easter eggs completely
* **File & Line:** [UIScene.ts:96-99](file:///workspace/raise-dead/src/scenes/UIScene.ts#L96-L99)
* **Cause:** `UIScene` routes joystick button taps to `world.tryRaiseGrave()`. `k1.diff` made `tryRaiseGrave` private and added `public interact()`. Touch players can never interact with eggs.
* **Exact Replacement:**
```typescript
// src/scenes/UIScene.ts:96-99
    this.joystick = new Joystick(this);
    this.joystick.onFPress(() => {
      const world = this.scene.get('GraveyardWorld') as { interact?: () => void };
      world?.interact?.();
    });
```

---

#### Bug 1.4: `grave_13` has no collision body (wizard walks through tombstone)
* **File & Line:** `research/n3/EasterEggManager.ts:93`
* **Cause:** Only `crypt_knock` and `mirror_well` are given colliders. `grave_13` renders `tomb_cracked` + `XIII` text, but has no collision body, unlike all other 40 tombstones.
* **Exact Replacement:**
```typescript
// research/n3/EasterEggManager.ts:93-99
      if (colliderGroup && (egg.id === 'crypt_knock' || egg.id === 'mirror_well' || egg.id === 'grave_13')) {
        const body = colliderGroup.create(egg.x, egg.y - 8, undefined) as Phaser.Physics.Arcade.Image;
        body.setVisible(false);
        const sb = body.body as Phaser.Physics.Arcade.StaticBody;
        const bw = egg.id === 'grave_13' ? 28 : Math.round(img.width * 0.7);
        sb.setSize(bw, 14);
        sb.reset(egg.x, egg.y - 6);
      }
```

---

#### Bug 1.5: `moon_howl` pool sprite is invisible until triggered
* **File & Line:** `research/n3/EasterEggManager.ts:63`
* **Cause:** `if (egg.id === 'black_cat' || egg.id === 'moon_howl') continue;` skips placing `moonPool`. `moonPool` is only added inside `doMoonHowl()`. The player is prompted to "Stand still in the moonlight...", but there is zero moonlight visible on the grass.
* **Exact Replacement:**
```typescript
// research/n3/EasterEggManager.ts:63
      if (egg.id === 'black_cat') continue;
      if (egg.id === 'moon_howl') {
        if (!this.moonPool && w.textures.exists('glow_moon')) {
          this.moonPool = w.add.image(egg.x, egg.y, 'glow_moon')
            .setTint(0xbfd8ff).setScale(1.2).setAlpha(0.25).setDepth(egg.y - 50);
        }
        continue;
      }
```

---

### 2. Gameplay & Fun Issues

1. **Black Cat Omen Timing vs. Lore Card:**
   - In `EasterEggManager.ts:218`, `delayedCall(eggId === 'black_cat' ? 2600 : 900)` displays `loreCard` at `t = 2.6s`.
   - `summonWitch()` fires at `t = 2.4s`. The witch flies horizontally across the top camera band (`y = worldView.top + 30..90`) for 5.0–6.5s.
   - `loreCard` (500×200px at `x=640, y=24`) covers the top center of the screen, completely blocking the witch fly-by climax.
   - **Fix:** Delay lore card until witch completes flight:
     ```typescript
     this.world.time.delayedCall(eggId === 'black_cat' ? 7500 : 900, () => { ... });
     ```

2. **Egg Placement vs. Paths & Traversal:**
   - `black_cat` at `(420, 900)` is 780px west of spawn `(1200, 900)`. Players looping the central resurrectable arc (`x: 1040..1500, y: 710..760`) will rarely hit it in a 10-minute session.
   - **Fix:** Move `black_cat` trigger to `(860, 870)` (radius 50) directly on the main west plaza exit path.
   - `mirror_well` at `(2230, 560)` is past the eastern perimeter path (`x: 2080..2136`). Extend path spur to `x: 2230` or place a worn dirt decal under the well so it doesn't look stranded.

3. **Hint UX Clashing:**
   - `eggHintText` at `(width/2, scale.height - 64)` shares screen position with [ProximityHint](file:///workspace/raise-dead/src/ui/ProximityHint.ts#L15) (`super(scene, 640, 650)`).
   - **Fix:** Hide `eggHintText` whenever `this.hint.visible === true`, and hide both on `overlayOpened`.

4. **Mobile F-Key UX:**
   - Text prompts currently say `Press F to ...` on mobile touchscreens.
   - **Fix:** Detect touch via `this.world.scene.get('UIScene')` joystick status:
     ```typescript
     const isTouch = (this.world.scene.get('UIScene') as any)?.joystick?.active;
     const verb = isTouch ? 'Tap' : 'Press';
     // return `${verb} to peer into the well (${this.wellPresses}/3)`;
     ```

---

### 3. K2: Iframe Game Graves Implementation

#### Security Analysis (Risk 1: Clicky Token & Same-Origin Iframe)
* **Token Storage:** In [clippy/api.ts:21](file:///workspace/raise-dead/src/graves/clippy/api.ts#L21), the token is stored in `localStorage.getItem('rd_clicky_token')`, and as an `HttpOnly; SameSite=Strict; Path=/api/clicky` cookie `rd_ck`.
* **Abuse Potential:** A same-origin iframe (`sandbox="allow-scripts allow-same-origin"`) shares `localStorage` with the parent and sends same-origin cookies with `fetch('/api/clicky/chat')`. A vendored game could drain the user's Clicky quota.
* **Resolution:** 
  1. Vendored OSS games are static, audited, and committed to git; they do not phone home.
  2. Enforce `connect-src 'none'` in `_headers` for `/games/*`. This prevents the iframe from making network calls to `/api/*` even with `allow-same-origin`.
  3. K3 Unmarked Grave (untrusted dynamic code) must strictly use `sandbox="allow-scripts"` (NO `allow-same-origin`) via `srcdoc`.

#### Exact `public/_headers` Rules
Add to [public/_headers](file:///workspace/raise-dead/public/_headers#L1):
```text
/games/*
  Content-Security-Policy: default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'none'; object-src 'none'; frame-ancestors 'self'
  Cache-Control: public, max-age=86400
```

#### Keyboard Focus & Esc Strategy
1. Keep the "Requiescat in pace" exit button permanently mounted in the parent DOM above the iframe (`z-index: 20`).
2. Because the iframe is same-origin, parent JavaScript can attach key listeners directly to `iframe.contentWindow`:
```typescript
iframe.addEventListener('load', () => {
  try {
    iframe.contentWindow?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.triggerExit();
    });
  } catch {}
});
```
3. When overlay unmounts, blur the iframe and re-enable Phaser global keyboard capture:
```typescript
if (this.gameScene?.input?.keyboard) {
  this.gameScene.input.keyboard.enableGlobalCapture();
}
```

#### Exact [GraveOverlay.ts](file:///workspace/raise-dead/src/ui/GraveOverlay.ts) Iframe Code
Add inside `tryMountAppAndBuildHeader` in [GraveOverlay.ts:134](file:///workspace/raise-dead/src/ui/GraveOverlay.ts#L134):
```typescript
    // K2: Iframe game graves
    if ((grave as any).game) {
      compactHeader = true;
      this.buildHeader(grave, baseUrl, content, appContainer, compactHeader);
      content.appendChild(appContainer);

      const iframe = document.createElement('iframe');
      iframe.src = `${baseUrl}${(grave as any).game}`;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock');
      iframe.setAttribute('allow', 'fullscreen; autoplay');
      iframe.style.cssText = 'width: 100%; height: 100%; border: 0; display: block; border-radius: 4px;';

      iframe.addEventListener('load', () => {
        try {
          iframe.contentWindow?.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') this.triggerExit();
          });
          iframe.focus();
        } catch {}
      });

      appContainer.style.overflow = 'hidden';
      appContainer.appendChild(iframe);
      this.finishMount(content, panel, wrapper, overlay, gameContainer);
      return;
    }
```

---

### 4. Credit & Time Wasters Before 07:30 IST Deadline

1. **Blindly applying `k1.diff`:**
   `k1.diff` modifies lines in [UIScene.ts](file:///workspace/raise-dead/src/scenes/UIScene.ts) and [worldAssets.ts](file:///workspace/raise-dead/src/scenes/worldAssets.ts) that were already partially applied or diverged in `main`. Kiro will get reject hunks (`.rej`), attempt loop refactorings, and burn 4–6 credits.
   *Action:* Provide Kiro the exact single-file replacements rather than raw `git apply`.

2. **K3 (Unmarked Grave AI generation):**
   Generating dynamic HTML games via Muse Spark, edge quota handlers, and iframe sandboxing in ~15 credits is high-risk. 
   *Action:* Explicitly postpone K3 until K1 and K2 are deployed, smoke-tested, and verified.

3. **Building games from source during K2:**
   If Kiro tries to build or resolve npm/CDN dependencies for `space-cadet` or `pipes`, credits will deplete immediately.
   *Action:* Hark must pre-build static single-directory bundles (`index.html` + local js/css/assets) in `public/games/<slug>/` with zero build dependencies before handing off to Kiro.
