# Review round 1 — Raise Dead Phase 1 (commit df2f9f8)

Reviewed 31 Oct 2026. Review only: no app code was changed. Kiro makes every fix below.

Reviewers: Antigravity `agy` with claude-sonnet-4-6 (code bugs), `agy` with default Gemini 3.8 Flash (security, perf, licensing, polish), Meta Muse `muse-spark-1.3-contributor` via API (state machine, pasted code), Grok CLI grok-4.7 (combined pass), plus a manual read of the code and screenshots. Findings are de-duplicated and checked against the code. Reviewer claims that turned out wrong are listed at the end so Kiro doesn't act on them.

Line numbers are from commit df2f9f8.

---

## How to run this in Kiro (2 sessions)

- **Session A: code-only fixes** (P0-1 to P0-6, P1-1 to P1-8, P1-16 to P1-18). Touches `src/scenes/GraveyardWorld.ts`, `ResurrectionRitual.ts`, `UIScene.ts`, `TitleScene.ts`, `CreditsScene.ts`, `src/ui/ProximityHint.ts`, `Joystick.ts`, `GraveOverlay.ts`, `index.html` (CSS only). Run `npm run build` and `node scripts/screenshots.mjs` at the end. Smoke-test: press F twice fast; Esc at each ritual phase; stand still at a grave after exit (plaque and hint must come back); open Credits from the graveyard and press F/WASD; `?touch=1` on a phone-sized viewport.
- **Session B: assets, security, licensing, performance** (P1-9 to P1-15, plus the P2s Kiro has room for). Self-host fonts, add CSP, use BASE_URL for paths, split the preload, re-encode audio, fix the wizard sprite glow, clean up the repo, complete CREDITS.

P2 items are optional. Fold them in only if a session has room.

---

## P0 — broken

**P0-1. F during the ritual restarts it (re-entrancy).** `GraveyardWorld.ts:439-456` `tryRaiseGrave()` has no `ritualActive` guard. `disableGlobalCapture()` (line 452, and `ResurrectionRitual.ts:140`) only stops preventDefault. Key events still fire, and so does the mobile F button. A second F during the ritual phase, or during the exit fade after `scene.resume('GraveyardWorld')`, calls `scene.launch('ResurrectionRitual')` on a running scene, which restarts it. That leaves the chant loop and voice playing twice (global SoundManager), keeps stale `ritualDelays`/`ritualTweens` arrays (they are instance fields and `init()` only resets `cancelled`), and can leave the DOM overlay orphaned. Raised by Sonnet, Muse and the manual read.
*Fix:* at the top of `tryRaiseGrave()` add `if (this.ritualActive || this.scene.isActive('ResurrectionRitual') || this.scene.isPaused('ResurrectionRitual')) return;`. In `ResurrectionRitual.init()` reset `phase='ritual'`, `ritualDelays=[]`, `ritualTweens=[]`, `overlay=null`, `chantLoop=null`, `voiceSound=null`.

**P0-2. Wizard keeps sliding during the ritual, and keys can stick after exit.** `tryRaiseGrave()` sets `ritualActive`, and `moveWizard()` then returns early (line 484) without zeroing velocity. If the player was walking when they pressed F, the wizard slides until the world pauses at overlay time. Keyup events missed while the world is paused also leave `isDown` stuck, so the wizard walks by itself after exit.
*Fix:* in `tryRaiseGrave()` call `this.wizard.setVelocity(0,0); this.wizard.play('idle',true);`. In the `ritualFullyEnded` handler (line 85) call `this.input.keyboard?.resetKeys();`.

**P0-3. Plaque and "Press F" hint don't come back after the ritual if the player stands still.** UIScene hides both on `ritualStarted`, but `checkProximity()` only emits when the grave id changes (line 565). `lastProxGraveId` still equals the same grave after exit, so nothing re-shows them. The comment at `UIScene.ts:323-325` assumes it will. (Muse and the manual read.)
*Fix:* in the `GraveyardWorld` `ritualFullyEnded` handler set `this.lastProxGraveId = null;` (keep `promptPlayedFor` so the chime doesn't replay). The next `update()` then re-emits `proximityChanged` and `plaqueChanged`.

**P0-4. Known leftover: "Press F" prompt shows faintly behind the subtitles. Root cause: a tween in a paused scene.** `tryRaiseGrave()` pauses UIScene (line 456) before the ritual's `create()` emits `ritualStarted` (`ResurrectionRitual.ts:143-146`). `ProximityHint.hide()` (`ProximityHint.ts:54-64`) fades out with a tween, and tweens don't advance in a paused scene. The hint stays at full alpha under the 0.75-alpha subtitle bar.
*Fix:* give `hide(immediate = false)` an immediate path: kill any running fade and the pulse tween, then `setAlpha(0).setVisible(false)`. In UIScene's `ritualStarted` and `overlayOpened` handlers call `this.hint.hide(true)`. Also track the fade tween in `show()`/`hide()` and kill it before starting a new one, because `show()` currently returns early while a fade-out is still running (`visible` is still true). (Sonnet #14.)

**P0-5. Mobile joystick and F button are off-screen, and joystick speed is about 60× too fast.** `Joystick` is built inside `GraveyardWorld`, whose camera zoom is 2 (`GraveyardWorld.ts:269`). ScrollFactor-0 objects are still scaled about the camera centre, so the F button at (1200,620) renders around x≈1760, off-canvas, and the stick is misplaced too. Separately, rex `forceX/forceY` are pixel distances (0 to radius 60), not 0-1 (`GraveyardWorld.ts:497-501`). A pure-horizontal push gives `dx=60`, which is never normalised, so velocity is 5400 px/s. (Sonnet #10/#11, Muse, manual.)
*Fix:* move `new Joystick(...)` into UIScene (zoom 1). Expose its state through `this.registry` (for example `registry.set('joy', {x,y})`, normalised as `forceX/radius` and clamped to [-1,1]) and an event for the F press that GraveyardWorld forwards to `tryRaiseGrave()`. In `moveWizard` read the normalised values. Hide the joystick and F button during the ritual and credits.

**P0-6. Game is cropped on phones and small laptop windows.** `index.html:32-36` hard-codes `#game-container {width:1280px;height:720px}` and `body{overflow:hidden}`. `Scale.FIT` fits to the parent, so the canvas never shrinks. (Flash #18, manual.)
*Fix:* `#game-container{width:100vw;height:100dvh;}` with the canvas centred by Phaser `autoCenter`. Add `touch-action:none` on `html, body` so the stick doesn't scroll or zoom the page. Keep the DOM overlay `position:fixed`. (Also Grok.)

---

## P1 — fix before the demo

### Session A (code)

**P1-1. Farewell voice never plays on exit.** `ResurrectionRitual.ts:415` `this.sound.get('farewell_requiescat')` only finds sounds already added, not cached audio, so it is always null. (Flash #3.) *Fix:* `if (this.cache.audio.exists('farewell_requiescat')) this.sound.play(...)`.

**P1-2. Listener and resource leaks in the ritual scene.** (Sonnet, Muse, Flash.)
- `openOverlay()` adds a `rip-exit` window listener (lines 396-400) that is only removed when the button is clicked. After an Esc exit it stays on `window`. Also, `GraveOverlay.mount()` already takes an `onExit` callback (line 385) that is never called, so there are two exit paths. *Fix:* drop the `rip-exit` CustomEvent. Make `GraveOverlay.triggerExit()` call `this.onExitCallback?.()`, and keep the idempotent phase guard in `startExitRitual()`.
- `voiceSound` is never destroyed (a new `sound.add` each ritual). Call `stop(); destroy(); = null` in both `exitCleanup()` and `cancel()`, and call `chantLoop.stop()` before `destroy()`.
- Untracked timers and tweens: the subtitle tweens (lines 333, 354), the camera-shake counter (line 243), and the delayed openOverlay (line 306). Push all of them to `ritualDelays`/`ritualTweens`. Also keep references to `sparkEmitter`/`dustEmitter` and destroy them in `cancel()` and `exitCleanup()`.
- On `cancel()`, also hide the subtitle bar and text, the rune circle, the burst and `whiteFill` immediately. Right now an Esc during the white-flash build leaves the screen partly white for 400 ms. Drop the no-op `this.cameras.main.fadeIn(400)` and use `this.time.delayedCall(250, finish)`.

**P1-3. Credits open over the live world.** `UIScene.ts:305-308` launches Credits and pauses only UIScene. GraveyardWorld keeps running, so WASD moves the wizard and F starts a ritual under the credits. *Fix:* on Credits open from the world, `scene.pause('GraveyardWorld')` too. On `goBack()` resume both, then `resetKeys()`. Also guard `CreditsScene.fetchCredits` so it does nothing if the scene stopped before fetch resolved (Sonnet #24).

**P1-4. Clicking "Credits" on the title also starts the game.** `TitleScene.ts:79` `this.input.once('pointerdown', ...)` fires for every click, including the Credits button (line 73). *Fix:* use the handler's `currentlyOver` argument and return if it is non-empty, or check `this.scene.isActive('CreditsScene')`.

**P1-5. Title music is effectively never heard.** `handleFirstInteraction()` starts the waltz on the first click and immediately fades it over 800 ms into the graveyard (`TitleScene.ts:104-122`). *Fix (demo polish that costs little):* first click or key = "unlock" (start the waltz, change the prompt to "Press Enter to enter the graveyard"); second input = fade and enter. Use `.once` on the Enter/Space keys.

**P1-6. Known leftover: plaque name text overlaps the frame top.** `UIScene.ts:357` `PADDING_TOP = 44`, but the nine-slice top border is 60 px (line 364: `60, 64, 60, 60`). The name text sits inside the carved frame. *Fix:* `PADDING_TOP = 66` and `PADDING_SIDE = 68` to clear the 64 px side slices. Raise `PANEL_H` to fit (about 230), or size it to the content using `epitaphText.height + causeText.height`. Re-check against `research/screens/04_prompt_plaque.png`.

**P1-7. Known leftover: dust cloud hides the wizard during the crumble.** `ResurrectionRitual.ts:269-277` emits six 512 px `kenney_smoke_04` puffs at scale 0.5 (256 px on screen) at depth 23 above the whole world layer, centred 10 px above the grave base, where the wizard stands about 80 screen px below. *Fix:* scale `{start:0.18,end:0.05}`, `angle:{min:200,max:340}` (upward fan), `speedY` negative, alpha 0.45, and emit at `graveScreenY - 24`. Better still, spawn the dust in GraveyardWorld at depth `tombstone.y + 1`, so the wizard (y-sorted below the grave) stays in front of it.

**P1-8. Fonts may render as the fallback on the canvas.** `main.ts:289` awaits `document.fonts.ready`, which only waits for fonts already in use. Pixelify Sans is often not requested yet, so Phaser Text objects bake in the fallback font and never re-render. There is also no timeout. *Fix:* `await Promise.race([Promise.all([document.fonts.load('20px "Pixelify Sans"'), document.fonts.load('20px Cinzel'), document.fonts.load('italic 15px Cinzel')]), new Promise(r=>setTimeout(r,2500))]);`.

### Session A additions (found by Grok, verified)

**P1-16. Ritual FX drift off the stone during the shake.** The rune circle, burst and sparks are placed once in the ritual scene's screen space (`ResurrectionRitual.ts:78-97`), but the shake runs on GraveyardWorld's camera (line 250). The stone shakes and the rune circle stays still. *Fix:* apply the same `shake()` to `this.cameras.main` in the ritual scene, in the same counter `onUpdate`. That is one line, cheaper than re-parenting the FX into the world.

**P1-17. Chant drone plays under the tribute overlay.** `chant_drone_loop` (line 200) only stops in `exitCleanup()` (line 446), so it drones the whole time the app is open. *Fix:* in `openOverlay()` tween `chantLoop.volume` to 0 over 800 ms, then stop it. Optionally bring the graveyard music back at about 0.15 under the overlay.

**P1-18. AudioManager tween stacking, and mute state not shown.** `duckMusic`/`restoreMusic`/`duckAmbient`/`restoreAmbient` (`AudioManager.ts:557-626`) add a new tween on the same sound each call, so an Esc during the 800 ms duck makes the duck and the restore fight. `stopMusic` nulls the track before the fade ends. *Fix:* call `this.scene.tweens.killTweensOf(sound)` before each new fade, and delete the ambient map entry when the fade starts. Also, `UIScene` always starts with 🔊 even if `localStorage.rd_muted==='1'`, and the title waltz ignores the saved mute. Read the saved flag when the HUD is created and in TitleScene (`this.sound.mute = localStorage.getItem('rd_muted')==='1'`).

### Session B (assets, security, perf, licensing)

**P1-9. Self-host fonts and add a CSP (known leftover).** `index.html:8-13` loads Google Fonts from the CDN. That is a privacy leak, breaks offline use, and blocks a strict CSP. *Fix:* put Cinzel (400/600/700, plus italic if available) and Pixelify Sans (400/500/600) WOFF2 files in `public/assets/fonts/` with `OFL.txt`, declare `@font-face` in `index.html` with `font-display:swap`, and remove the preconnects. Then add:
`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; frame-src 'self' blob:; object-src 'none'; base-uri 'self'">`
(Phaser needs `'unsafe-inline'` styles and `blob:`/`data:` images. Check that the console stays clean in `vite preview`. When the Worker proxy lands, add its origin to `connect-src`, ideally as a same-origin `/api` route.) Also add `public/_headers` for Cloudflare Pages with the same CSP plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

**P1-10. Root-absolute asset paths conflict with `base: './'`.** `PreloadScene.ts:47-193` (`/assets/...`, `/data/...`), `GraveOverlay.ts:59,89-93` (CSS `border-image url('/assets/...')` and medal `src`), and `CreditsScene.ts:95` (`fetch('/CREDITS.md')`) all break if the game is ever served from a sub-path (GitHub Pages `/raise-dead/`, a Devpost embed). *Fix:* in PreloadScene call `this.load.setPath(import.meta.env.BASE_URL)` (or `setBaseURL`) and drop the leading `/`. Use `${import.meta.env.BASE_URL}assets/...` in GraveOverlay and CreditsScene. Delete the `ImportMeta` shim in `main.ts:282-284` and add `/// <reference types="vite/client" />` instead.

**P1-11. Phase 2 app loader can't work in a production build and 404s on every overlay.** `GraveOverlay.ts:209` `import(/* @vite-ignore */ \`../graves/${graveId}/index.ts\`)` makes the browser request a raw `.ts` URL that Vite never emits. *Fix:* `const apps = import.meta.glob('../graves/*/index.ts');` then `apps[\`../graves/${id}/index.ts\`]?.()`. This produces lazy chunks and no 404s.

**P1-12. First load is about 12 MB before the title screen.** Everything is preloaded up front (`PreloadScene.ts:132-189`): about 7.5 MB of audio in one format (music loops 1.4-1.8 MB each at 103-117 kbps stereo; ambient loops 0.4-1 MB at 79-162 kbps stereo), 1 MB of voice and 3.3 MB of images. Add the Phaser chunk (1.5 MB raw, roughly 340 KB gzip). That is slow on mobile 4G for judges. *Fix:*
- Preload only the title (keyart, waltz, UI, fonts, data). Start a background `this.load` of the world and ritual assets in TitleScene after it renders, and gate "enter" on completion with a small progress ring.
- Re-encode music and ambient as mono Ogg Vorbis/Opus at about 64 kbps and SFX at about 48 kbps, with MP3 fallbacks at matching rates. The aim is under 4 MB total audio per format. Keep loop points (re-check seams).
- Remove load calls for keys never used in `src`: `kenney_spark_04, kenney_magic_01, kenney_magic_03, kenney_star_01, kenney_light_01, kenney_twirl_01, sky_moon, crow_perched, fog_puff, rune_circle, leaves_strip, ui_hover, ui_select, ui_back, open_panel, close_panel, rune_sparkle_short`, or wire them up (see P2). Delete the unused `public/assets/images/wizard/mage_idle1.png`.
- Fog: three 2400×1800 TileSprites (`GraveyardWorld.ts:307-319`) cover the whole world at alpha, which is heavy overdraw on mobile GPUs while the camera shows about 640×360. Size them to the camera view (`setScrollFactor(0)` plus scroll `tilePosition` by camera scroll × parallax) (Grok).
- Downscale particle PNGs: Kenney 512 px sparks and smoke can be 128 px, `rune_circle_add` 512 px at 356 KB can be 256 px, `holy_light_burst` 1024 px can be 512 px.

**P1-13. Known leftover: red outline and glow around the wizard and staff when idle.** It is baked into the art. `public/assets/images/wizard/mage_idle.png` and `attack_front.png` have about 1,850 red pixels each, mostly semi-transparent glow around the staff and cloak, while `walk_down.png` has only the opaque red trim (414 px). So the halo appears whenever the wizard stops, as in `research/screens/02_graveyard.png`. *Fix (Kiro script, keep the original in `assets/`):* with Pillow or ImageMagick, clear pixels in the idle and attack sheets where `alpha<255 && r>150 && g<110 && b<110` (the glow), leaving the opaque trim. Optionally hue-shift the remaining red trim to the teal palette (#7fd1d8) across all wizard sheets so the hero matches the moonlit palette. Note "modified from original" in CREDITS (CC-BY 3.0 asks for changes to be indicated).

**P1-14. Repo hygiene (known leftover): 56 MB of raw `assets/` is committed; `.git` holds about 104 MB of loose objects.** `assets/images/src` alone is 16 MB of AI source renders, and `assets/audio` holds 27 MB including masters never shipped. Judges clone public repos, and Kiro reads them too, which costs credits when it scans. *Fix:* `git rm -r --cached assets/images/src` and add it to `.gitignore`, then move the masters to a release asset or Drive. Keep only `assets/**/MANIFEST.json`, STYLE.md and the shipped vendor originals needed for licence proof. Run `git gc`. History rewrite (`git filter-repo --path assets/images/src --invert-paths`) is optional and needs a force-push; ask Jay first. Also add `research/screens/*.png` and `research/kiro-logs/` to a size check. Keep them if they are part of the Kiroween story, but they shouldn't grow every round.

**P1-15. Licensing and attribution gaps vs CREDITS.md.**
- No **Fonts** section: Cinzel (Natanael Gama) and Pixelify Sans (Stefie Justprince), both SIL OFL 1.1. Add the section and ship `OFL.txt` next to the WOFF2 files.
- No **Code/libraries** section: Phaser 3.90.0 (MIT, Phaser Studio), phaser3-rex-plugins 1.80.20 (MIT, Rex Rainbow), Vite and TypeScript (dev only).
- Folder names in the images table (`vendor/movicx-wizard/`, `vendor/kenney-*`) don't match what ships (`public/assets/images/wizard/`, `public/assets/images/kenney/`). Add a "shipped as" column so the `assets-credits` hook and judges can trace each file.
- CC-BY lines (Movicx wizard; congusbongus/swuing dirt footsteps) should include the licence URL `https://creativecommons.org/licenses/by/3.0/` and "modified" where the files were edited (the footsteps were trimmed and normalised; the wizard will be after P1-13). Update the `REQUIRED` array in `CreditsScene.ts:8-9` and README to match.
- Add a trademark disclaimer to README, CREDITS and the in-game credits: "Road Rash, Google Reader, Clippy, Winamp and other product names are trademarks of their respective owners. Raise Dead is an unofficial fan tribute, not affiliated with or endorsed by them; no original logos, art or code are used." The medallions are generic (checked against CREDITS); keep it that way in Phase 2 (no EA, Microsoft or Nullsoft art).
- State the AI image model or tool used for "original" images (CREDITS line 17). Hackathon rules commonly ask for AI disclosure; Jay to confirm the exact tool name.
- Piper voice: CREDITS cites the model card's LibriVox public-domain training data. Re-check the licence field of `en_US-norman-medium` on Hugging Face before submission. Not verified in this round.

---

## P2 — polish (judge wow, cheap first)

1. **Demo hotkeys** `1`-`5`: teleport to each tribute grave (reuse `teleportToGrave`). Show them only with `?demo=1`, which keeps a 3-minute pitch tight. Gate `window.__RD` behind `import.meta.env.DEV || ?debug=1` (`main.ts:294`).
2. **Make the lights actually work or remove them.** `setupLights()` (`GraveyardWorld.ts:276-295`) enables 11 lights and flickers them every frame, but nothing uses `Light2D`, because `Tombstone.applyLightPipeline()` is never called. Either apply Light2D to the ground, tombstones, trees and wizard (warm pumpkin pools are a big mood win), or delete it to save mobile GPU time.
3. **Firefly dots are frozen.** `GraveyardWorld.ts:382-386` creates the dot at the start position and never moves it while the wisp orbits. Update `dot.setPosition(wisp.x, wisp.y)` in the counter's `onUpdate`.
4. **Leaves use one texture.** `GraveyardWorld.ts:328` passes only `leaf_1`. Add `frame`/`texture` as a random pick of leaf_1..8, or use `leaves_strip` frames. Also limit the emit zone to the camera view ±100 px instead of 2400 px wide (about 95% are emitted off-screen), and raise `frequency` to make it denser for the same cost.
5. **Fog speed lookup every frame** via `Object.getOwnPropertyDescriptor` (`GraveyardWorld.ts:589-594`). Store `{sprite, sx, sy}` objects instead.
6. **Mute icon is an emoji** (`UIScene.ts:284`) and shows as a tofu box in headless Chromium (see `02_graveyard.png`, top right). Use a small pixel-art speaker image or text "♪ on/off" in Pixelify.
7. **Plaque fade-out and tween hygiene** (`UIScene.ts:459-477`): store the show tween, kill it on hide, and fade out over 150 ms.
8. **`medal_generic` texture is never loaded** (`UIScene.ts:375`): load it or default to `medal_unmarked` to avoid a missing-texture frame.
9. **`GraveOverlay.unmount()` selector** `'div > div'` (line 233) picks the wrapper, not the panel. Store the panel ref, and `clearTimeout` any pending removal on re-mount.
10. **Ritual juice:** a sub-bass `navigator.vibrate?.([60,40,120])` on mobile at the stone crack; a short `cameras.main.flash` tint; `postFX.addBloom` on the holy burst (WebGL only); orbiting teal wisps that spiral into the stone during the incantation; a "visited" state (a small lit candle by graves already raised) so the world remembers the demo. Note: `exitCleanup()` resets the stone to `plain` after `startExitRitual()` set `rubble`. Decide which is intended; keeping `plain` lets a grave be raised again, so add the candle instead of leaving rubble.
11. **Title to world transition:** cross-fade the waltz into the wind howl, and pan the camera down from the moon to the plaza (1-2 s).
12. **Footstep detune** ±80 cents (`AudioManager.ts:647`) to avoid machine-gun repetition.
13. **Overlay exit button**: style it as carved stone (reuse the frame_panel slice) and add a keyboard focus ring. Move focus into the overlay on open (accessibility, and Esc and Enter work predictably).
14. **Physics bodies** use dummy images with an `undefined` texture (`GraveyardWorld.ts:134`). Swap to `this.physics.add.staticBody(...)`.
15. **Credits mask** passes a Rectangle cast as Graphics (`CreditsScene.ts:66`). It works in the current screenshot, but `this.make.graphics().fillRect(...).createGeometryMask()` is the supported form.
16. **Drop rex-plugins** for a 60-line custom stick once P0-5 moves the joystick to UIScene. This is optional: the import is already tree-shaken to the single plugin file, so the bundle cost is small. The win is fewer dependencies.
17. **Touch copy:** the hint says "Press F" on touch devices. Show "Tap F to raise the dead" when the joystick is active (Grok).
18. **Crow flap tween** repeats forever after the crow is destroyed (`GraveyardWorld.ts:618-635`). Call `this.tweens.killTweensOf(this.crow)` in `onComplete`.
19. **iOS resume:** on `visibilitychange` back to visible, re-`play()` any ambient or music loop whose `isPlaying` is false.
20. **Compression and caching:** Cloudflare Pages already serves Brotli. Add long-cache `_headers` for `/assets/*` (hashed JS) and medium-cache for audio and images.

---

## Reviewer claims checked and rejected (don't act on these)

- Muse: "exitCleanup never resumes UIScene". Wrong: GraveyardWorld's `ritualFullyEnded` handler resumes it (`GraveyardWorld.ts:85-88`). The real HUD bug is P0-3.
- Muse: "camera shake runs on the paused world". Wrong: the world is only paused at `openOverlay()`, after the shake.
- Sonnet #9: "screen position wrong under Scale.FIT". Wrong: game coordinates are independent of the CSS display scale.
- Sonnet #5: "double resume of UIScene is a bug". It is harmless; tidy it only while doing P1-2.
- Flash #6: "API key leaks". No API calls exist yet; no secrets are in `src/` or `dist/`. Keep it as a Phase 2 rule: the Worker proxy holds `MODEL_API_KEY`, and the client never calls `api.meta.ai` directly.
- Flash #11/#13: "drop MP3s" and "unreferenced long audio in public/". Phaser downloads only one format per key, so the duplicates cost repo size, not load time. Keep the MP3 fallback for older iOS Safari. The unreferenced files are in raw `assets/`, not `public/`, and are covered by P1-14.
- Flash #10: "rex-plugins is 50 MB". That is the node_modules size; only the joystick file is bundled (`dist/assets/index-*.js` is 64 KB).

## Security summary

No secrets in the repo, `src/` or `dist/`. All DOM text uses `textContent`, with no `innerHTML`. `graves.json` is safe as rendered. Gaps: no CSP and third-party fonts (P1-9); debug global `window.__RD` exposed in production (P2-1). For Phase 2, the Unmarked Grave generated apps must run in `<iframe sandbox="allow-scripts">` with `srcdoc` and no `allow-same-origin`, behind the Worker proxy with per-IP rate limits.

## Reviewer usage (round 1)

| Reviewer | Calls | Usage |
|---|---|---|
| agy, claude-sonnet-4-6 | 2 (the first was auto-denied after trying a shell tool; the rerun was told to use file reads only) | Free tier. Plain-text mode doesn't report tokens. Use `--output-format json` next round to log them. |
| agy, Gemini 3.8 Flash (default) | 1 | Free tier, tokens not reported |
| Grok CLI grok-4.7 | 1 prompt (about 15 min run) | Counts against the free weekly cap. No token count in plain output. |
| Muse muse-spark-1.3-contributor | 2 | 18,965 tokens total: 14,776 prompt + 4,189 completion (3,233 of them reasoning). Call 1 used all of `max_tokens=1800` on reasoning and returned empty. Call 2 used `reasoning_effort:"low"` and `max_tokens=3500`. Next time, send `reasoning_effort:"low"` from the start. |

Raw reviewer outputs: `/workspace/work/rr1/` (`agy_sonnet.txt`, `agy_flash.txt`, `grok.txt`, `muse_resp2.json`).
