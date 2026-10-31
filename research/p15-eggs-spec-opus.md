# Halloween Easter Eggs — Implementation Spec

> [!IMPORTANT]
> 5 Easter eggs, localStorage persistence, HUD counter. **F key priority: graves first, eggs second.** Never fire during `ritualActive`, overlay, or credits.

---

## Global Architecture

### New files
- `src/easter/EasterEggManager.ts` — manages all 5 eggs, discovery state, F-key dispatch
- `src/easter/eggDefinitions.ts` — static data (positions, text, sprite keys)

### Persistence
**localStorage key:** `rd_eggs_found` → JSON string array of discovered egg IDs, e.g. `["black_cat","pumpkin_carve"]`. Read on `create()`, write on each discovery.

### F-key priority (modify `GraveyardWorld.setupInput`)
Replace `keydown-F` handler and joystick `onFPress`:
```
1. if ritualActive || overlay open → no-op
2. if activeGrave (resurrectable, within PROX_DIST) → tryRaiseGrave()
3. else → easterEggManager.tryInteract(wizardX, wizardY)
```
Same logic for mobile F button callback.

### HUD counter (in `UIScene.create`)
Add text at **top-right, below mute icon**: position `(width - 12, 40)`, origin `(1, 0)`, depth 100, scrollFactor 0.
```
🎃 Secrets: 2/5
```
Font: Pixelify Sans 14px, color `#c9b98a`. Update via event `eggFound` emitted to UIScene. Hide if 0 found (show only after first discovery).

---

## Egg 1: `black_cat`

| Field | Value |
|---|---|
| **Position** | `(420, 900)` — left side of horizontal path, between trees at (400,550) and (350,1400), open grass |
| **Trigger** | Wizard walks within **30 art px** of position → cat sprite appears, darts across wizard's path (tween 1.5s), meow SFX, plaque auto-shows. No F needed. One-time only. |
| **Sprite** | `black_cat` — 32×24 px PNG, side-view black cat silhouette, green eyes, tail up. Load in `worldAssets`. |
| **Sound** | `cat_meow` — short meow SFX (~0.5s), 0.5 vol. New audio file. |
| **Visual FX** | Cat fades in at `(420, 900)`, tweens to `(520, 870)` over 1.5s with slight sine-Y wobble, then fades out. Tiny green glow_moon eyes while visible. |
| **Plaque** | **Title:** "A Black Cat Crossed Your Path!" **Text:** "In medieval Europe, people believed black cats were witches' companions. If one crossed your path, bad luck would follow! In many cultures today, black cats on Halloween are actually symbols of mystery and magic — not misfortune." |
| **Found behaviour** | Set `black_cat` discovered. Cat sprite destroyed after fade. Plaque auto-hides after 8s or on walk-away (>80px). |

---

## Egg 2: `pumpkin_carve`

| Field | Value |
|---|---|
| **Position** | `(340, 1100)` — lower-left area, between tree (300,1200) and grave row 4 (380,1080), offset south. Clear of paths. |
| **Trigger** | Uncarved pumpkin visible at position. Wizard within **35 art px** → hint shows "Press F to carve". Press F once → carving animation + plaque. |
| **Sprite** | `pumpkin_uncarved` — 28×28 px, plain orange pumpkin (no face). On carve: swap to existing `jackolantern_lit` + add `glow_warm` underneath. Load `pumpkin_uncarved` in worldAssets. |
| **Sound** | `pumpkin_carve_sfx` — short knife/scrape sound (~0.7s). New audio. |
| **Visual FX** | On F: shake pumpkin sprite ±2px for 0.4s, swap texture to `jackolantern_lit`, add warm glow (reuse existing glow_warm + flicker tween pattern from `spawnDecoratives`). |
| **Plaque** | **Title:** "The Legend of Stingy Jack" **Text:** "Carved pumpkins are called jack-o'-lanterns after an Irish tale: a trickster named Jack trapped the Devil twice and was doomed to wander the earth with only a carved turnip lantern. When Irish immigrants came to America, they switched to pumpkins — bigger and easier to carve!" |
| **Found behaviour** | Pumpkin stays lit permanently (visual reward). Mark `pumpkin_carve` found. |

---

## Egg 3: `grave_13`

| Field | Value |
|---|---|
| **Position** | `(2050, 1500)` — far bottom-right corner, away from all graves/paths/trees. Deliberately hidden in a dark, foggy corner. |
| **Trigger** | Wizard within **35 art px** → hint "Press F to read". Press F → plaque appears. |
| **Sprite** | Reuse `tomb_deco_cross`. Place at position with shadow ellipse, same pattern as decorative graves. Add a faint eerie green glow_moon (alpha 0.15, scale 0.2) to hint something is special. No medallion. **Epitaph on stone:** "XIII" (use existing text rendering on the stone or just rely on the plaque). |
| **Sound** | Reuse `gate_creak_01` at 0.4 vol, pitch-shifted (detune: -200). |
| **Visual FX** | On discovery: brief camera shake (intensity 0.003, duration 300ms). Glow pulses brighter (alpha 0.15→0.4 over 0.5s, then settles at 0.25). |
| **Plaque** | **Title:** "The 13th Grave" **Text:** "The number 13 has been considered unlucky for centuries. Some say it comes from the Last Supper's 13 guests, others from Norse mythology. Fear of 13 is called 'triskaidekaphobia.' Many buildings still skip the 13th floor — and graveyards sometimes skip the 13th plot!" |
| **Found behaviour** | Glow remains at 0.25 alpha permanently. Mark `grave_13` found. |

---

## Egg 4: `crypt_knock`

| Field | Value |
|---|---|
| **Position** | `(200, 700)` — far left edge, between trees at (250,860) and (280,300). Open grass area, feels like edge of the graveyard. |
| **Trigger** | Stone crypt door sprite visible. Wizard within **35 art px** → hint "Press F to knock". Press F three times (within 4s window, reset if >4s gap) → door opens, candy spills out, plaque shows. **Track press count in EasterEggManager.** |
| **Sprite** | `crypt_door` — 40×56 px, stone archway/door, dark grey with iron bands. New sprite. On "open": swap to `crypt_door_open` (same size, door ajar, warm glow inside). |
| **Sound** | `knock_wood` — short knock/rap (~0.3s). Play on each F press. After 3rd knock: `door_creak` (reuse `gate_creak_01` at normal pitch) + a short `candy_drop` chime (~0.4s, new). |
| **Visual FX** | Each knock: tiny screen-shake (0.001, 100ms). On 3rd: door swaps texture, 3-4 small coloured circles (candy) tween-scatter outward from door base (simple coloured dots, no new sprite needed — use scene.add.circle 4px, colours [0xff6b35, 0xffd700, 0xff1493, 0x00ff88], tween fall+fade over 1.5s). |
| **Plaque** | **Title:** "Trick or Treat!" **Text:** "Knocking on doors for treats has ancient roots! In medieval Britain and Ireland, 'souling' meant going door to door on All Souls' Day, singing prayers for the dead in exchange for 'soul cakes.' In Scotland, this became 'guising' — wearing disguises and performing for treats. That's where trick-or-treating comes from!" |
| **Found behaviour** | Door stays open. Mark `crypt_knock` found. |

---

## Egg 5: `moonlit_howl`

| Field | Value |
|---|---|
| **Position** | `(1200, 1650)` — bottom centre, below the vertical path end (1176, y=960+640=1600), in a small open clearing. |
| **Trigger** | Wizard stands still within **25 art px** for **3 continuous seconds** (no movement). Auto-triggers: wolf howl SFX, brief moon-brightening, plaque. No F press needed. |
| **Sprite** | No new world sprite. FX only: a translucent wolf silhouette (`wolf_howl` — 48×40 px, white/grey silhouette) fades in at `(1200, 1620)` above wizard, howls (scale pulse 1→1.1 over 0.8s), then fades out over 1.5s. |
| **Sound** | `wolf_howl_sfx` — distant wolf howl (~2s). New audio. 0.45 vol. |
| **Visual FX** | Ambient light brightens briefly: `this.lights.setAmbientColor(0x8090c0)` for 2s, then tween back to `0x5a6a96`. Wolf silhouette sprite ADD blend, alpha 0→0.6→0 over 3s total. |
| **Plaque** | **Title:** "Howl at the Moon" **Text:** "For thousands of years, people linked wolves and the full moon. In medieval Europe, 'werewolf' legends said some people transformed into wolves under a full moon. The word 'lunatic' comes from 'luna' (moon) — people once believed moonlight itself could cause madness!" |
| **Found behaviour** | Wolf fades out. Ambient returns to normal. Mark `moonlit_howl` found. Won't re-trigger. |

---

## New Assets Summary

| Key | Path | Type | Size (px) |
|---|---|---|---|
| `black_cat` | `assets/images/world/black_cat.png` | image | 32×24 |
| `pumpkin_uncarved` | `assets/images/world/pumpkin_uncarved.png` | image | 28×28 |
| `crypt_door` | `assets/images/world/crypt_door.png` | image | 40×56 |
| `crypt_door_open` | `assets/images/world/crypt_door_open.png` | image | 40×56 |
| `wolf_howl` | `assets/images/fx/wolf_howl.png` | image | 48×40 |
| `cat_meow` | `assets/audio/sfx/cat_meow.{ogg,mp3}` | audio | ~0.5s |
| `pumpkin_carve_sfx` | `assets/audio/sfx/pumpkin_carve.{ogg,mp3}` | audio | ~0.7s |
| `knock_wood` | `assets/audio/sfx/knock_wood.{ogg,mp3}` | audio | ~0.3s |
| `candy_drop` | `assets/audio/sfx/candy_drop.{ogg,mp3}` | audio | ~0.4s |
| `wolf_howl_sfx` | `assets/audio/sfx/wolf_howl.{ogg,mp3}` | audio | ~2s |

Register all in `queueWorldAssets` → new `queueEasterEggAssets(load)` helper.

---

## Edge Cases

| Case | Behaviour |
|---|---|
| **Ritual active** | `EasterEggManager.tryInteract()` returns early if `ritualActive` or `ResurrectionRitual` scene is active |
| **Overlay/Credits open** | Same guard — check `scene.isActive('CreditsScene')` |
| **Already found** | Egg-specific: `black_cat` doesn't spawn again; `pumpkin_carve` stays lit; `grave_13` glow stays; `crypt_door` stays open; `moonlit_howl` won't re-trigger. Plaque can still be re-read on approach for `grave_13` and `crypt_knock`. |
| **Plaque collision** | Easter egg plaques use the same `plaqueChanged` event. If wizard is near both a grave and an egg, grave plaque takes priority (F-key already guards this). |
| **Mobile** | F button triggers same `tryInteract()` fallback. Auto-trigger eggs (black_cat, moonlit_howl) work identically — no F needed. Hint text adapts: "Tap F to carve" / "Tap F to knock" / "Tap F to read" via joystick.active check. |
| **moonlit_howl timer** | Reset stillness timer whenever wizard velocity > 0. Use a `standStillTimer` counter in `update()`. |
| **crypt_knock timeout** | Store `knockCount` and `lastKnockTime`. If `Date.now() - lastKnockTime > 4000`, reset count to 0. |
| **Multiple eggs in range** | Unlikely given spacing (>800px apart). If it happens, pick closest. |
